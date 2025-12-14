import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const shiprocketOrderId = shipment.shiprocket_order_id;
    const shiprocketShipmentId = shipment.shiprocket_shipment_id;

    // Shiprocket cancel can accept order ids; this varies by API. We try order id first.
    const payload: any = {};
    if (shiprocketOrderId) payload.ids = [String(shiprocketOrderId)];
    else if (shiprocketShipmentId) payload.ids = [String(shiprocketShipmentId)];
    else return NextResponse.json({ error: 'No Shiprocket order/shipment id to cancel' }, { status: 400 });

    const response = await shiprocketRequest<any>('/v1/external/orders/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await caseMainPool.execute(
      `UPDATE shipments
       SET status = 'cancelled',
           response_json = ?
       WHERE order_id = ?`,
      [JSON.stringify(response), orderId]
    );

    const [orderRows]: any = await caseMainPool.execute(
      'SELECT id, order_number, customer_email, customer_name, order_status FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    const order = orderRows?.[0];

    // Mark order cancelled (if not already terminal)
    if (order && String(order.order_status || '').toLowerCase() !== 'cancelled') {
      await caseMainPool.execute(
        `UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        [orderId]
      );
    }

    // Email customer/admin about cancellation
    if (order && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const customerHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2>Cancelled</h2>
            <p>Hi ${escapeHtml(order.customer_name)},</p>
            <p>Your order <strong>${escapeHtml(order.order_number)}</strong> has been cancelled.</p>
            <p>If you have questions, contact us at info@casebuddy.co.in</p>
          </div>
        `;
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2>Cancelled</h2>
            <p>Order <strong>${escapeHtml(order.order_number)}</strong> was cancelled via Shiprocket.</p>
            <p>Customer: ${escapeHtml(order.customer_email)}</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
          to: order.customer_email,
          subject: `Your order has been cancelled - ${order.order_number}`,
          html: customerHtml,
        });

        await transporter.sendMail({
          from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || 'info@casebuddy.co.in',
          subject: `🛑 CANCELLED - ${order.order_number}`,
          html: adminHtml,
        });
      } catch {
        // ignore email errors
      }
    }

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to cancel shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
