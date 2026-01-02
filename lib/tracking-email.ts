import nodemailer from 'nodemailer';
import caseMainPool from '@/lib/db-main';

async function logEmail(orderId: number, emailType: string, recipientEmail: string, subject: string, status: 'sent' | 'failed', errorMessage?: string) {
  try {
    await caseMainPool.execute(
      `INSERT INTO email_logs (order_id, email_type, recipient_email, subject, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, emailType, recipientEmail, subject, status, errorMessage || null]
    );
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

export async function sendTrackingEmail(orderId: number, orderNumber: string, customerEmail: string, customerName: string, awb: string, trackingUrl?: string) {
  console.log(`[TRACKING EMAIL] Attempting to send tracking email for order ${orderNumber}, AWB: ${awb}, to: ${customerEmail}`);
  
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[TRACKING EMAIL] Email credentials not configured! EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET', 'EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
    await logEmail(orderId, 'tracking_update', customerEmail, `Your Order ${orderNumber} is Shipped! - Tracking Info`, 'failed', 'Email credentials not configured');
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
      rejectUnauthorized: false
    }
  });

  const trackingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2196F3; }
        .awb-number { font-size: 24px; font-weight: bold; color: #2196F3; margin: 10px 0; letter-spacing: 1px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order is on its Way!</h1>
          <p>Tracking information for Order ${orderNumber}</p>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div class="tracking-box">
            <h2>Tracking Details</h2>
            <div class="info-row">
              <strong>Order Number:</strong> ${orderNumber}
            </div>
            <div class="info-row">
              <strong>AWB / Tracking Number:</strong>
            </div>
            <div class="awb-number">${awb}</div>
            ${trackingUrl ? `
              <a href="${trackingUrl}" target="_blank" class="button">Track Your Order</a>
            ` : ''}
            <p style="margin-top: 15px; color: #666;">
              You can use this tracking number to check the status of your shipment on the courier's website.
            </p>
          </div>

          <div class="tracking-box">
            <h3>What's Next?</h3>
            <p>✅ Your order is with the courier</p>
            <p>🚚 It will be delivered in 5-7 business days</p>
            <p>📧 You'll receive updates via email and SMS</p>
            <p>📱 Track anytime at <a href="https://casebuddy.co.in/orders">casebuddy.co.in/orders</a></p>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at info@casebuddy.co.in or +918107624752</p>
          <p>&copy; ${new Date().getFullYear()} CaseBuddy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`[TRACKING EMAIL] Sending email to ${customerEmail} with subject: Your Order ${orderNumber} is Shipped!`);
    await transporter.sendMail({
      from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `📦 Your Order ${orderNumber} is Shipped! - Tracking Info`,
      html: trackingHtml,
    });
    await logEmail(orderId, 'tracking_update', customerEmail, `Your Order ${orderNumber} is Shipped! - Tracking Info`, 'sent');
    console.log(`[TRACKING EMAIL] ✅ SUCCESS - Tracking email sent to ${customerEmail} for order ${orderNumber}`);
  } catch (error) {
    await logEmail(orderId, 'tracking_update', customerEmail, `Your Order ${orderNumber} is Shipped! - Tracking Info`, 'failed', String(error));
    console.error('[TRACKING EMAIL] ❌ FAILED - Error sending tracking email:', error);
    throw error;
  }
}
