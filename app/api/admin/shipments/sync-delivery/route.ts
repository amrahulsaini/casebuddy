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

function firstNonEmpty(...values: any[]) {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return null;
}

function normalizeText(value: any) {
  return String(value ?? '').trim();
}

function mapShiprocketToOrderStatus(rawStatus: string): 'shipped' | 'delivered' | 'cancelled' | null {
  const s = rawStatus.toLowerCase();
  if (!s) return null;

  if (s.includes('delivered')) return 'delivered';

  // RTO / returned shipments: treat as cancelled for store workflow.
  if (s.includes('rto') || s.includes('return') || s.includes('returned')) return 'cancelled';

  if (s.includes('cancel')) return 'cancelled';

  // Anything indicating movement with courier.
  if (
    s.includes('in transit') ||
    s.includes('out for delivery') ||
    s.includes('shipped') ||
    s.includes('picked') ||
    s.includes('pickup') ||
    s.includes('manifest') ||
    s.includes('dispatched')
  ) {
    return 'shipped';
  }

  return null;
}

function shouldUpdateOrderStatus(current: string | null, next: string): boolean {
  const c = (current || '').toLowerCase();
  if (c === 'cancelled' || c === 'delivered') return false;
  if (next === 'delivered') return true;
  if (next === 'cancelled') return c !== 'cancelled';
  if (next === 'shipped') return c !== 'shipped' && c !== 'delivered';
  return false;
}

async function authorize(request: NextRequest) {
  // Option A: logged-in admin
  try {
    await requireRole(['admin', 'manager']);
    return;
  } catch {
    // ignore and try secret
  }

  // Option B: server-to-server secret (for cron)
  const secret = process.env.SHIPROCKET_SYNC_SECRET || '';
  if (!secret) {
    throw new Error('Unauthorized');
  }

  const header = request.headers.get('x-sync-secret') || '';
  if (header !== secret) {
    throw new Error('Unauthorized');
  }
}

type ShipmentRow = {
  id: number;
  order_id: number;
  shiprocket_awb: string | null;
  shiprocket_courier_name: string | null;
  tracking_url: string | null;
  status: string | null;
  order_status: string | null;
  order_number: string;
  customer_name: string;
  customer_email: string;
};

async function sendShipmentStatusEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: 'shipped' | 'cancelled';
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;

  const subject =
    params.status === 'shipped'
      ? `Your order has been shipped - ${params.orderNumber}`
      : `Your order has been cancelled - ${params.orderNumber}`;

  const statusLine =
    params.status === 'shipped'
      ? 'Your order has been shipped.'
      : 'Your order has been cancelled.';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>${params.status === 'shipped' ? 'Shipped' : 'Cancelled'}</h2>
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>${statusLine}</p>
      <p>Order: <strong>${escapeHtml(params.orderNumber)}</strong></p>
      <p>You can track your order anytime at <a href="https://casebuddy.co.in/orders" target="_blank" rel="noreferrer">https://casebuddy.co.in/orders</a></p>
      <p>Questions? Contact us at info@casebuddy.co.in</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
    to: params.to,
    subject,
    html,
  });
}

async function sendShipmentStatusAdminEmail(params: {
  orderNumber: string;
  customerEmail: string;
  status: 'shipped' | 'cancelled';
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
  const to = process.env.ADMIN_EMAIL || 'info@casebuddy.co.in';
  const subject =
    params.status === 'shipped'
      ? `📦 SHIPPED - ${params.orderNumber}`
      : `🛑 CANCELLED - ${params.orderNumber}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>${params.status === 'shipped' ? 'Shipped' : 'Cancelled'}</h2>
      <p>Order <strong>${escapeHtml(params.orderNumber)}</strong> is now <strong>${escapeHtml(params.status)}</strong>.</p>
      <p>Customer: ${escapeHtml(params.customerEmail)}</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export async function POST(request: NextRequest) {
  try {
    await authorize(request);

    const body = await request.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(50, Number(body?.limit ?? 20)));
    const orderId = body?.orderId ? Number(body.orderId) : null;

    const params: any[] = [];
    let where = `s.provider = 'shiprocket' AND s.shiprocket_awb IS NOT NULL AND s.shiprocket_awb <> ''`;
    if (orderId) {
      where += ` AND s.order_id = ?`;
      params.push(orderId);
    }

    // Only sync paid-ish orders to avoid unnecessary calls.
    where += ` AND LOWER(COALESCE(o.payment_status, '')) IN ('paid','completed','confirmed')`;

    const [rows]: any = await caseMainPool.execute(
      `SELECT
        s.id,
        s.order_id,
        s.shiprocket_awb,
        s.shiprocket_courier_name,
        s.tracking_url,
        s.status,
        o.order_status,
        o.order_number,
        o.customer_name,
        o.customer_email
       FROM shipments s
       JOIN orders o ON o.id = s.order_id
       WHERE ${where}
       ORDER BY s.updated_at ASC
       LIMIT ${limit}`,
      params
    );

    const shipments: ShipmentRow[] = rows || [];

    const results: any[] = [];
    for (const sh of shipments) {
      const awb = normalizeText(sh.shiprocket_awb);
      if (!awb) continue;

      try {
        const response = await shiprocketRequest<any>(
          `/v1/external/courier/track/awb/${encodeURIComponent(String(awb))}`,
          { method: 'GET' }
        );

        const trackingUrl = firstNonEmpty(response?.tracking_url, response?.trackingUrl, sh.tracking_url);
        const courierName = firstNonEmpty(
          response?.courier_name,
          response?.courierName,
          response?.tracking_data?.courier_name,
          sh.shiprocket_courier_name
        );

        const shipStatus = firstNonEmpty(
          response?.tracking_data?.shipment_status,
          response?.tracking_data?.shipment_track?.[0]?.current_status,
          response?.current_status,
          sh.status
        );

        const mapped = shipStatus ? mapShiprocketToOrderStatus(String(shipStatus)) : null;

        await caseMainPool.execute(
          `UPDATE shipments
           SET tracking_url = COALESCE(?, tracking_url),
               shiprocket_courier_name = COALESCE(shiprocket_courier_name, ?),
               status = COALESCE(?, status),
               response_json = ?
           WHERE id = ?`,
          [
            trackingUrl ? String(trackingUrl) : null,
            courierName ? String(courierName) : null,
            shipStatus ? String(shipStatus) : null,
            JSON.stringify(response),
            sh.id,
          ]
        );

        let orderUpdatedTo: string | null = null;
        if (mapped && shouldUpdateOrderStatus(sh.order_status, mapped)) {
          await caseMainPool.execute(
            `UPDATE orders
             SET order_status = ?, updated_at = NOW()
             WHERE id = ?`,
            [mapped, sh.order_id]
          );
          orderUpdatedTo = mapped;

          if (mapped === 'shipped' || mapped === 'cancelled') {
            try {
              await sendShipmentStatusEmail({
                to: sh.customer_email,
                customerName: sh.customer_name,
                orderNumber: sh.order_number,
                status: mapped,
              });
              await sendShipmentStatusAdminEmail({
                orderNumber: sh.order_number,
                customerEmail: sh.customer_email,
                status: mapped,
              });
            } catch {
              // ignore email errors
            }
          }
        }

        results.push({
          orderId: sh.order_id,
          shipmentId: sh.id,
          awb,
          shipStatus: shipStatus ? String(shipStatus) : null,
          orderUpdatedTo,
        });
      } catch (e: any) {
        results.push({
          orderId: sh.order_id,
          shipmentId: sh.id,
          awb,
          error: e?.message || 'Shiprocket sync failed',
        });
      }
    }

    return NextResponse.json({ success: true, synced: results.length, results });
  } catch (error: any) {
    const msg = error?.message || 'Failed to sync delivery statuses';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
