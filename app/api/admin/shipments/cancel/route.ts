import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';
import nodemailer from 'nodemailer';
import {
  buildEmailShell,
  buildItemsHtml,
  escapeHtml,
  fetchPrimaryImagesByProductId,
  parseItemsFromCustomizationJson,
} from '@/lib/order-email-utils';

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

type OrderRow = {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  order_status: string | null;
  product_name: string;
  phone_model: string;
  quantity: number;
  customization_data: string | null;
};

async function sendShipmentCancelledEmails(args: { order: OrderRow; reason?: string | null }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://casebuddy.co.in').replace(/\/+$/, '');
  const fallbackItem = {
    productId: null,
    productName: args.order.product_name,
    phoneModel: args.order.phone_model,
    designName: null,
    quantity: Number(args.order.quantity) || 1,
  };

  const items = parseItemsFromCustomizationJson({
    customizationData: args.order.customization_data,
    fallback: fallbackItem,
  });

  const productIds = items
    .map((it) => it.productId)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const imageByProductId = await fetchPrimaryImagesByProductId({
    pool: caseMainPool as any,
    productIds,
    baseUrl,
  });

  const itemsHtml = buildItemsHtml({ items, imageByProductId });
  const reasonHtml = args.reason
    ? `<div class="card"><p style="margin:0;"><strong>Reason:</strong> ${escapeHtml(args.reason)}</p></div>`
    : '';

  const customerBody = `
    <p>Hi ${escapeHtml(args.order.customer_name)},</p>
    <p>Your shipment for order <strong>${escapeHtml(args.order.order_number)}</strong> has been cancelled.</p>
    ${reasonHtml}
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Items</h3>
      ${itemsHtml}
    </div>
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Need Help?</h3>
      <p style="margin:0;">Contact us at <a href="mailto:info@casebuddy.co.in">info@casebuddy.co.in</a></p>
    </div>
  `;

  const customerHtml = buildEmailShell({
    title: 'Shipment Cancelled',
    subtitle: `Order ${args.order.order_number}`,
    bodyHtml: customerBody,
    theme: 'danger',
  });

  const adminBody = `
    <p><strong>Shipment cancelled</strong> for order <strong>${escapeHtml(args.order.order_number)}</strong></p>
    <div class="card">
      <p style="margin:0;">Customer: ${escapeHtml(args.order.customer_name)} (${escapeHtml(args.order.customer_email)})</p>
    </div>
    ${reasonHtml}
  `;

  const adminHtml = buildEmailShell({
    title: 'Shipment Cancelled',
    subtitle: `Order ${args.order.order_number}`,
    bodyHtml: adminBody,
    theme: 'danger',
  });

  await transporter.sendMail({
    from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
    to: args.order.customer_email,
    subject: `Shipment cancelled - ${args.order.order_number}`,
    html: customerHtml,
  });

  await transporter.sendMail({
    from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || 'info@casebuddy.co.in',
    subject: `❌ Shipment cancelled - ${args.order.order_number}`,
    html: adminHtml,
  });
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
      'SELECT id, order_number, customer_email, customer_name, order_status, product_name, phone_model, quantity, customization_data FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    const order = orderRows?.[0] as OrderRow | undefined;

    // Mark order cancelled (if not already terminal)
    if (order && String(order.order_status || '').toLowerCase() !== 'cancelled') {
      await caseMainPool.execute(
        `UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        [orderId]
      );
    }

    // Email customer/admin about cancellation (styled + items/images)
    if (order) {
      try {
        await sendShipmentCancelledEmails({ order, reason: null });
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
