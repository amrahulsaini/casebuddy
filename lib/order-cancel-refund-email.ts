import nodemailer from 'nodemailer';
import caseMainPool from '@/lib/db-main';
import { buildEmailShell, escapeHtml } from '@/lib/order-email-utils';

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

export async function sendOrderCancelledRefundEmail(args: {
  orderId: number;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  refundId?: string | null;
}) {
  const { orderId, orderNumber, customerEmail, customerName, totalAmount, refundId } = args;
  const subject = `Your Order ${orderNumber} has been Cancelled & Refunded`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[CANCEL/REFUND EMAIL] Email credentials not configured, skipping');
    await logEmail(orderId, 'order_cancelled_refunded', customerEmail, subject, 'failed', 'Email credentials not configured');
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
      rejectUnauthorized: false,
    },
  });

  const bodyHtml = `
    <p>Dear ${escapeHtml(customerName)},</p>
    <p>Your order <strong>${escapeHtml(orderNumber)}</strong> has been cancelled and a refund has been initiated.</p>
    <div class="card">
      <div style="padding:6px 0;"><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</div>
      <div style="padding:6px 0;"><strong>Refund Amount:</strong> ₹${escapeHtml(totalAmount.toFixed(2))}</div>
      ${refundId ? `<div style="padding:6px 0;"><strong>Refund Reference:</strong> ${escapeHtml(refundId)}</div>` : ''}
    </div>
    <p>The refund will be credited back to your original payment method within 5-7 business days, as per Razorpay's processing timelines.</p>
    <p>If you have any questions about this cancellation or refund, please reach out to us.</p>
  `;

  const html = buildEmailShell({
    title: 'Order Cancelled & Refund Initiated',
    subtitle: `Order ${orderNumber}`,
    bodyHtml,
    theme: 'danger',
  });

  try {
    await transporter.sendMail({
      from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html,
    });
    await logEmail(orderId, 'order_cancelled_refunded', customerEmail, subject, 'sent');
  } catch (error) {
    await logEmail(orderId, 'order_cancelled_refunded', customerEmail, subject, 'failed', String(error));
    console.error('[CANCEL/REFUND EMAIL] Failed to send:', error);
  }
}
