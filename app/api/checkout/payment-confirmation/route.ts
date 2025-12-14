import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';
import { RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';

interface Order extends RowDataPacket {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  product_id?: number;
  product_name: string;
  phone_model: string;
  design_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_id: string | null;
  notes: string | null;
  customization_data: string | null;
  created_at: Date;
}

interface OrderItem extends RowDataPacket {
  product_name: string;
  quantity: number;
  price: number;
  customization_text: string | null;
  preview_url: string | null;
}

type EmailItem = {
  productId?: number | null;
  productName: string;
  phoneModel: string;
  designName?: string | null;
  quantity: number;
  imageUrl?: string | null;
  customization?: {
    customText?: string;
    font?: string;
    placement?: string;
  };
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseEmailItemsFromOrder(order: Order): { items: EmailItem[]; singleCustomizationHtml: string } {
  const fallbackItem: EmailItem = {
    productId: typeof order.product_id === 'number' ? order.product_id : null,
    productName: order.product_name,
    phoneModel: order.phone_model,
    designName: order.design_name,
    quantity: Number(order.quantity) || 1,
  };

  if (!order.customization_data) {
    return { items: [fallbackItem], singleCustomizationHtml: '' };
  }

  try {
    const parsed = JSON.parse(order.customization_data);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      const items: EmailItem[] = parsed.items.map((it: any) => ({
        productId: it.productId != null ? Number(it.productId) : (it.product_id != null ? Number(it.product_id) : null),
        productName: it.productName || it.product_name || 'Item',
        phoneModel: it.phoneModel || it.phone_model || '',
        designName: it.designName || it.design_name || null,
        quantity: Math.max(1, parseInt(it.quantity) || 1),
        customization: it.customizationOptions ? {
          customText: it.customizationOptions.customText,
          font: it.customizationOptions.font,
          placement: it.customizationOptions.placement,
        } : undefined,
      }));

      return { items, singleCustomizationHtml: '' };
    }

    // Backward-compatible single-item customization payload
    const customText = parsed?.customText;
    const font = parsed?.font;
    const placement = parsed?.placement;
    const hasAny = !!(customText || font || placement);
    const singleCustomizationHtml = hasAny
      ? `
        <div class="customization">
          <strong>🎨 Customization:</strong><br/>
          ${customText ? `Text: "${escapeHtml(customText)}"<br/>` : ''}
          ${font ? `Font: ${escapeHtml(font)}<br/>` : ''}
          ${placement ? `Placement: ${escapeHtml(String(placement).replace(/_/g, ' '))}` : ''}
        </div>
      `
      : '';

    return { items: [fallbackItem], singleCustomizationHtml };
  } catch {
    return { items: [fallbackItem], singleCustomizationHtml: '' };
  }
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // First, get the Cashfree order ID from our database
      const [orderRows] = await connection.execute<Order[]>(
        'SELECT payment_id FROM orders WHERE id = ?',
        [orderId]
      );

      console.log('Order query result:', orderRows);

      if (orderRows.length === 0) {
        console.error('Order not found in database:', orderId);
        throw new Error('Order not found');
      }

      const cashfreeOrderId = orderRows[0].payment_id;
      console.log('Cashfree order ID from DB:', cashfreeOrderId);

      if (!cashfreeOrderId) {
        console.error('Payment ID not found for order:', orderId);
        throw new Error('Payment ID not found for this order');
      }

      // Verify payment with Cashfree API using the correct order ID
      console.log('Verifying payment with Cashfree for order ID:', cashfreeOrderId);
      const cashfreeResponse = await fetch(
        `https://api.cashfree.com/pg/orders/${cashfreeOrderId}`,
        {
          method: 'GET',
          headers: {
            'x-client-id': process.env.CASHFREE_APP_ID || '',
            'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
            'x-api-version': '2023-08-01'
          }
        }
      );

      const paymentData = await cashfreeResponse.json();

      console.log('Cashfree payment verification response:', {
        status: cashfreeResponse.status,
        data: paymentData
      });

      // Update order status based on payment verification
      if (paymentData.order_status === 'PAID') {
        console.log('Payment verified as PAID, updating order status...');
        await connection.execute(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          ['completed', 'processing', orderId]
        );
        console.log('Order status updated successfully');

        // Fetch order details
        const [orderRows] = await connection.execute<Order[]>(
          'SELECT * FROM orders WHERE id = ?',
          [orderId]
        );

        if (orderRows.length === 0) {
          throw new Error('Order not found');
        }

        const order = orderRows[0];
        console.log('Sending confirmation emails for order:', order.order_number);

        // Send emails (order has product info embedded, no separate items table)
        try {
          await sendOrderConfirmationEmails(order);
          console.log('Confirmation emails sent successfully');
        } catch (emailError) {
          console.error('Failed to send emails, but payment was successful:', emailError);
          // Don't fail the whole request if email fails
        }

        return NextResponse.json({
          success: true,
          message: 'Payment confirmed and emails sent'
        });
      } else {
        console.log('Payment not completed, status:', paymentData.order_status);
        // Payment failed or pending
        const paymentStatus = paymentData.order_status === 'ACTIVE' ? 'pending' : 'failed';
        const orderStatus = paymentData.order_status === 'ACTIVE' ? 'pending' : 'cancelled';
        
        await connection.execute(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          [paymentStatus, orderStatus, orderId]
        );
        console.log('Order marked as:', paymentStatus);

        // TRANSACTION ROLLBACK: Delete order if payment failed (not just pending)
        if (paymentData.order_status !== 'ACTIVE') {
          // Emails disabled (confirmation-only policy)

          console.log('Payment failed, deleting order from database...');
          await connection.execute(
            'DELETE FROM orders WHERE id = ?',
            [orderId]
          );
          console.log(`Order ${orderId} deleted due to payment failure`);
        }

        return NextResponse.json({
          success: false,
          message: `Payment not completed. Status: ${paymentData.order_status}`,
          paymentStatus: paymentData.order_status
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to confirm payment',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

async function sendOrderConfirmationEmails(order: Order) {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured, skipping email sending');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'casebuddy.co.in',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });

  const { items, singleCustomizationHtml } = parseEmailItemsFromOrder(order);

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://casebuddy.co.in').replace(/\/+$/, '');

  const productIds = Array.from(
    new Set(
      items
        .map((it) => (it.productId != null ? Number(it.productId) : null))
        .filter((v): v is number => v != null && Number.isFinite(v))
    )
  );

  const imageByProductId = new Map<number, string>();
  if (productIds.length > 0) {
    try {
      const placeholders = productIds.map(() => '?').join(',');
      const [rows]: any = await pool.query(
        `SELECT product_id, image_url, is_primary, sort_order, id
         FROM product_images
         WHERE product_id IN (${placeholders})
         ORDER BY is_primary DESC, sort_order ASC, id ASC`,
        productIds
      );

      for (const r of rows || []) {
        const pid = Number(r.product_id);
        const rawUrl = pickString(r.image_url);
        const url = rawUrl
          ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
          : null;
        if (!Number.isFinite(pid) || !url) continue;
        if (!imageByProductId.has(pid)) imageByProductId.set(pid, url);
      }
    } catch {
      // ignore image lookup failures
    }
  }

  const itemsHtml = items
    .map((item) => {
      const customization = item.customization;
      const hasCustomization = !!(customization?.customText || customization?.font || customization?.placement);
      const imgUrl = item.productId != null ? imageByProductId.get(Number(item.productId)) : null;
      const imageHtml = imgUrl
        ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.productName)}" style="width:80px;height:auto;border-radius:8px;border:1px solid #eee;display:block;margin:0 0 10px 0;" />`
        : '';
      return `
        <div class="item">
          ${imageHtml}
          <p><strong>${escapeHtml(item.productName)}</strong></p>
          ${item.phoneModel ? `<p>Phone Model: ${escapeHtml(item.phoneModel)}</p>` : ''}
          ${item.designName ? `<p>Design: ${escapeHtml(item.designName)}</p>` : ''}
          ${hasCustomization ? `
            <div class="customization">
              <strong>🎨 Customization:</strong><br/>
              ${customization?.customText ? `Text: "${escapeHtml(customization.customText)}"<br/>` : ''}
              ${customization?.font ? `Font: ${escapeHtml(customization.font)}<br/>` : ''}
              ${customization?.placement ? `Placement: ${escapeHtml(String(customization.placement).replace(/_/g, ' '))}` : ''}
            </div>
          ` : ''}
          <p>Quantity: ${escapeHtml(item.quantity)}</p>
        </div>
      `;
    })
    .join('');

  // Customer email HTML
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .customization { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        <div class="content">
          <p>Dear ${order.customer_name},</p>
          <p>Your order has been confirmed and is being processed.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>

            <h3>Items:</h3>
            ${itemsHtml}
            ${items.length === 1 ? singleCustomizationHtml : ''}
            
            <p class="total">Total: ₹${order.total_amount}</p>
          </div>
          
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>${order.shipping_address_line1}</p>
            ${order.shipping_address_line2 ? `<p>${order.shipping_address_line2}</p>` : ''}
            <p>${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
            <p>Mobile: ${order.customer_mobile}</p>
          </div>

          <div class="order-details">
            <h3>Track Your Order</h3>
            <p>You can track your order anytime at:</p>
            <p><a href="https://casebuddy.co.in/orders" target="_blank" rel="noreferrer">https://casebuddy.co.in/orders</a></p>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at info@casebuddy.co.in</p>
          <p>&copy; ${new Date().getFullYear()} CaseBuddy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Admin email HTML
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 15px; color: #4CAF50; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Received</h1>
          <p>Order ${order.order_number}</p>
        </div>
        <div class="content">
          <div class="highlight">
            <p><strong>Payment Status:</strong> ${order.payment_status.toUpperCase()}</p>
            <p><strong>Order Status:</strong> ${order.order_status.toUpperCase()}</p>
          </div>
          
          <div class="order-details">
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email}</p>
            <p><strong>Mobile:</strong> ${order.customer_mobile}</p>
          </div>
          
          <div class="order-details">
            <h2>Shipping Address</h2>
            <p>${order.shipping_address_line1}</p>
            ${order.shipping_address_line2 ? `<p>${order.shipping_address_line2}</p>` : ''}
            <p>${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
          </div>
          
          <div class="order-details">
            <h2>Product Details</h2>
            ${itemsHtml}
            ${items.length === 1 ? singleCustomizationHtml : ''}
            
            <p class="total">Total Amount: ₹${order.total_amount}</p>
          </div>
          
          <div class="order-details">
            <p><strong>Payment ID:</strong> ${order.payment_id || 'N/A'}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send customer email
  await transporter.sendMail({
    from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
    to: order.customer_email,
    subject: `Order Confirmation - ${order.order_number}`,
    html: customerEmailHtml,
  });

  // Send admin email
  await transporter.sendMail({
    from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Order ${order.order_number} - ${order.customer_name}`,
    html: adminEmailHtml,
  });
}
