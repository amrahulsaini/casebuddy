import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';
import { RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';

interface Order extends RowDataPacket {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_id: string | null;
  created_at: Date;
}

interface OrderItem extends RowDataPacket {
  product_name: string;
  quantity: number;
  price: number;
  customization_text: string | null;
  preview_url: string | null;
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

      if (orderRows.length === 0) {
        throw new Error('Order not found');
      }

      const cashfreeOrderId = orderRows[0].payment_id;

      if (!cashfreeOrderId) {
        throw new Error('Payment ID not found for this order');
      }

      // Verify payment with Cashfree API using the correct order ID
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

      console.log('Cashfree payment verification:', paymentData);

      // Update order status based on payment verification
      if (paymentData.order_status === 'PAID') {
        await connection.execute(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          ['completed', 'processing', orderId]
        );

        // Fetch order details
        const [orderRows] = await connection.execute<Order[]>(
          'SELECT * FROM orders WHERE id = ?',
          [orderId]
        );

        if (orderRows.length === 0) {
          throw new Error('Order not found');
        }

        const order = orderRows[0];

        // Fetch order items
        const [itemRows] = await connection.execute<OrderItem[]>(
          'SELECT product_name, quantity, price, customization_text, preview_url FROM order_items WHERE order_id = ?',
          [orderId]
        );

        // Send emails
        await sendOrderConfirmationEmails(order, itemRows);

        return NextResponse.json({
          success: true,
          message: 'Payment confirmed and emails sent'
        });
      } else {
        // Payment failed or pending
        const paymentStatus = paymentData.order_status === 'ACTIVE' ? 'pending' : 'failed';
        const orderStatus = paymentData.order_status === 'ACTIVE' ? 'pending' : 'cancelled';
        
        await connection.execute(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          [paymentStatus, orderStatus, orderId]
        );

        return NextResponse.json({
          success: false,
          message: 'Payment not completed'
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

async function sendOrderConfirmationEmails(order: Order, items: OrderItem[]) {
  const transporter = nodemailer.createTransport({
    host: 'mail.casebuddy.co.in',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            
            <h3>Items:</h3>
            ${items.map(item => `
              <div class="item">
                <p><strong>${item.product_name}</strong></p>
                <p>Quantity: ${item.quantity} × ₹${item.price}</p>
                ${item.customization_text ? `<p>Customization: ${item.customization_text}</p>` : ''}
              </div>
            `).join('')}
            
            <p class="total">Total: ₹${order.total_amount}</p>
          </div>
          
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>${order.address}</p>
            <p>${order.city}, ${order.state} - ${order.pincode}</p>
            <p>Mobile: ${order.customer_mobile}</p>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@casebuddy.co.in</p>
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
          <p>Order #${order.id}</p>
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
            <p>${order.address}</p>
            <p>${order.city}, ${order.state} - ${order.pincode}</p>
          </div>
          
          <div class="order-details">
            <h2>Order Items</h2>
            ${items.map(item => `
              <div class="item">
                <p><strong>${item.product_name}</strong></p>
                <p>Quantity: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}</p>
                ${item.customization_text ? `<p><strong>Customization:</strong> ${item.customization_text}</p>` : ''}
                ${item.preview_url ? `<p><a href="${item.preview_url}">View Preview</a></p>` : ''}
              </div>
            `).join('')}
            
            <p class="total">Total Amount: ₹${order.total_amount}</p>
          </div>
          
          <div class="order-details">
            <p><strong>Payment ID:</strong> ${order.payment_id || 'N/A'}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
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
    subject: `Order Confirmation - Order #${order.id}`,
    html: customerEmailHtml,
  });

  // Send admin email
  await transporter.sendMail({
    from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Order #${order.id} - ${order.customer_name}`,
    html: adminEmailHtml,
  });
}
