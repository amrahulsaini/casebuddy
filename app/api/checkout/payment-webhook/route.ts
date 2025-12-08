import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify webhook signature
    if (signature && CASHFREE_SECRET_KEY) {
      const computedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('base64');
      
      if (signature !== computedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { data, type } = body;
    
    console.log('Cashfree Webhook:', { type, data });

    // Handle payment success
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      const orderId = order.order_id.split('_')[1]; // Extract orderId from "order_123_timestamp"
      
      // Update order status
      await caseMainPool.query(
        `UPDATE orders SET 
          payment_status = ?,
          order_status = ?,
          payment_method = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['paid', 'confirmed', order.payment_group || 'online', orderId]
      );
      
      console.log(`Order ${orderId} marked as paid`);
      
      // Fetch order details to send confirmation emails
      const [orderRows]: any = await caseMainPool.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (orderRows.length > 0) {
        const orderDetails = orderRows[0];
        
        // Send emails now that payment is confirmed
        try {
          // Customer email
          const customerEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd; }
                .product-item { padding: 15px 0; border-bottom: 1px solid #eee; }
                .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
                .total-row { font-weight: bold; font-size: 18px; color: #ff6b00; padding-top: 15px; border-top: 2px solid #ddd; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Payment Confirmed!</h1>
                  <p>Your order is being processed</p>
                </div>
                <div class="content">
                  <p>Hi ${orderDetails.customer_name},</p>
                  <p>We've received your payment and your order is now confirmed. Here are your order details:</p>
                  
                  <div class="order-details">
                    <h3>Order #${orderDetails.order_number}</h3>
                    
                    <div class="product-item">
                      <strong>${orderDetails.product_name}</strong><br>
                      ${orderDetails.phone_model}${orderDetails.design_name ? ` • ${orderDetails.design_name}` : ''}<br>
                      Quantity: ${orderDetails.quantity}
                    </div>
                    
                    <div class="summary-row">
                      <span>Subtotal:</span>
                      <span>₹${parseFloat(orderDetails.subtotal).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                      <span>Shipping:</span>
                      <span>${orderDetails.shipping_cost === 0 ? 'FREE' : `₹${parseFloat(orderDetails.shipping_cost).toFixed(2)}`}</span>
                    </div>
                    <div class="summary-row total-row">
                      <span>Total Paid:</span>
                      <span>₹${parseFloat(orderDetails.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <h3>Shipping Address</h3>
                  <p>
                    ${orderDetails.customer_name}<br>
                    ${orderDetails.shipping_address_line1}<br>
                    ${orderDetails.shipping_address_line2 ? `${orderDetails.shipping_address_line2}<br>` : ''}
                    ${orderDetails.shipping_city}, ${orderDetails.shipping_state} ${orderDetails.shipping_pincode}<br>
                    Phone: ${orderDetails.customer_mobile}
                  </p>
                  
                  <p>We'll send you a shipping confirmation email with tracking details once your order ships (7-10 business days).</p>
                  
                  <p>If you have any questions, feel free to contact us at +918107624752 or reply to this email.</p>
                  
                  <p>Best regards,<br>Team CaseBuddy</p>
                </div>
                <div class="footer">
                  <p>CaseBuddy - Premium Phone Cases<br>
                  Rajgarh, Rajasthan 331023<br>
                  Phone: +918107624752 | Email: info@casebuddy.co.in</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          // Admin email
          const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
                .order-details { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #ddd; }
                .info-row { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; }
                .info-label { font-weight: bold; width: 150px; color: #666; }
                .info-value { flex: 1; }
                .product-section { background: #fff3e0; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ff6b00; }
                .total-amount { font-size: 24px; font-weight: bold; color: #22c55e; text-align: center; padding: 15px; background: white; border-radius: 8px; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💰 Payment Received!</h1>
                  <p>Order #${orderDetails.order_number}</p>
                </div>
                <div class="content">
                  <h3>Order Information</h3>
                  <div class="order-details">
                    <div class="info-row">
                      <div class="info-label">Order Number:</div>
                      <div class="info-value"><strong>${orderDetails.order_number}</strong></div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Payment Status:</div>
                      <div class="info-value" style="color: #22c55e; font-weight: bold;">✅ PAID</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Payment Method:</div>
                      <div class="info-value">${orderDetails.payment_method || 'Online'}</div>
                    </div>
                  </div>

                  <h3>Customer Details</h3>
                  <div class="order-details">
                    <div class="info-row">
                      <div class="info-label">Name:</div>
                      <div class="info-value">${orderDetails.customer_name}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Email:</div>
                      <div class="info-value">${orderDetails.customer_email}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Mobile:</div>
                      <div class="info-value">${orderDetails.customer_mobile}</div>
                    </div>
                  </div>

                  <h3>Shipping Address</h3>
                  <div class="order-details">
                    <div>${orderDetails.shipping_address_line1}</div>
                    ${orderDetails.shipping_address_line2 ? `<div>${orderDetails.shipping_address_line2}</div>` : ''}
                    <div>${orderDetails.shipping_city}, ${orderDetails.shipping_state} ${orderDetails.shipping_pincode}</div>
                  </div>

                  <h3>Product Details</h3>
                  <div class="product-section">
                    <strong>${orderDetails.product_name}</strong><br>
                    <div style="margin-top: 8px;">
                      Phone Model: ${orderDetails.phone_model}<br>
                      ${orderDetails.design_name ? `Design: ${orderDetails.design_name}<br>` : ''}
                      Quantity: ${orderDetails.quantity}<br>
                      Unit Price: ₹${parseFloat(orderDetails.unit_price).toFixed(2)}
                    </div>
                  </div>

                  <div class="total-amount">
                    Total Received: ₹${parseFloat(orderDetails.total_amount).toFixed(2)}
                  </div>

                  <p style="text-align: center; margin-top: 25px; color: #666; font-size: 14px;">
                    ⚡ Action Required: Please process and ship this order.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          // Send customer confirmation
          await transporter.sendMail({
            from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
            to: orderDetails.customer_email,
            subject: `Payment Confirmed - Order #${orderDetails.order_number}`,
            html: customerEmailHtml
          });

          // Send admin notification
          await transporter.sendMail({
            from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || 'info@casebuddy.co.in',
            subject: `💰 PAID - Order #${orderDetails.order_number} - ₹${parseFloat(orderDetails.total_amount).toFixed(2)}`,
            html: adminEmailHtml
          });
          
          console.log(`Payment confirmation emails sent for order ${orderId}`);
        } catch (emailError) {
          console.error('Error sending payment confirmation emails:', emailError);
        }
      }
    }
    
    // Handle payment failure
    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const { order } = data;
      const orderId = order.order_id.split('_')[1];
      
      await caseMainPool.query(
        `UPDATE orders SET 
          payment_status = ?,
          order_status = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['failed', 'cancelled', orderId]
      );
      
      console.log(`Order ${orderId} marked as failed`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
