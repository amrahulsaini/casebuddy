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

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}

function firstNonEmpty(...values: any[]) {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return null;
}

function extractAwbAndCourier(response: any) {
  const dataNode = response?.data;
  const data0 = Array.isArray(dataNode) ? dataNode[0] : dataNode;

  const awb = firstNonEmpty(
    response?.awb_code,
    response?.awb,
    response?.awbCode,
    getByPath(response, 'data.awb_code'),
    getByPath(response, 'data.awb'),
    getByPath(response, 'data.awbCode'),
    data0?.awb_code,
    data0?.awb,
    data0?.awbCode,
    getByPath(response, 'data.data.awb_code'),
    getByPath(response, 'data.data.awb'),
    getByPath(response, 'data.data.awbCode'),
    getByPath(response, 'response.awb_code')
  );

  const courier = firstNonEmpty(
    response?.courier_name,
    response?.courierName,
    response?.courier_company_name,
    response?.courierCompanyName,
    getByPath(response, 'data.courier_name'),
    getByPath(response, 'data.courierName'),
    getByPath(response, 'data.courier_company_name'),
    getByPath(response, 'data.courierCompanyName'),
    data0?.courier_name,
    data0?.courierName,
    data0?.courier_company_name,
    data0?.courierCompanyName,
    getByPath(response, 'data.data.courier_name'),
    getByPath(response, 'data.data.courier_company_name')
  );

  return {
    awb: awb != null ? String(awb) : null,
    courier: courier != null ? String(courier) : null,
  };
}

function tryParseShiprocketErrorPayload(message: string): any | null {
  // shiprocketRequest throws: `Shiprocket request failed (400) /path: {...json...}`
  const idx = message.indexOf(':');
  if (idx === -1) return null;
  const tail = message.slice(idx + 1).trim();
  if (!tail.startsWith('{') || !tail.endsWith('}')) return null;
  try {
    return JSON.parse(tail);
  } catch {
    return null;
  }
}

function extractAwbFromText(text: string): string | null {
  const m = /Current\s+AWB\s+([0-9A-Za-z-]+)/i.exec(text || '');
  return m?.[1] ? String(m[1]) : null;
}

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  phone_model: string;
  quantity: number;
  customization_data: string | null;
};

async function sendAwbAssignedEmails(args: {
  order: OrderRow;
  awb: string;
  courierName?: string | null;
  trackingUrl?: string | null;
}) {
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

  const trackingLine = args.trackingUrl
    ? `<p style="margin:0;">Tracking link: <a href="${escapeHtml(args.trackingUrl)}" target="_blank" rel="noreferrer">${escapeHtml(args.trackingUrl)}</a></p>`
    : `<p style="margin:0;">Tracking will appear on your orders page shortly.</p>`;

  const customerBody = `
    <p>Hi ${escapeHtml(args.order.customer_name)},</p>
    <p>Tracking is now available for your order <strong>${escapeHtml(args.order.order_number)}</strong>.</p>
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Shipment Details</h3>
      <p style="margin:0 0 6px 0;"><strong>AWB:</strong> ${escapeHtml(args.awb)}</p>
      ${args.courierName ? `<p style="margin:0 0 6px 0;"><strong>Courier:</strong> ${escapeHtml(args.courierName)}</p>` : ''}
      ${trackingLine}
    </div>
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Items</h3>
      ${itemsHtml}
    </div>
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Track Your Order</h3>
      <p style="margin:0;">You can also track your order anytime at <a href="https://casebuddy.co.in/orders" target="_blank" rel="noreferrer">https://casebuddy.co.in/orders</a></p>
    </div>
  `;

  const customerHtml = buildEmailShell({
    title: 'Tracking Available',
    subtitle: `Order ${args.order.order_number}`,
    bodyHtml: customerBody,
    theme: 'success',
  });

  const adminBody = `
    <p><strong>AWB assigned</strong> for order <strong>${escapeHtml(args.order.order_number)}</strong></p>
    <div class="card">
      <p style="margin:0 0 6px 0;"><strong>AWB:</strong> ${escapeHtml(args.awb)}</p>
      ${args.courierName ? `<p style="margin:0 0 6px 0;"><strong>Courier:</strong> ${escapeHtml(args.courierName)}</p>` : ''}
      ${args.trackingUrl ? `<p style="margin:0;">Tracking: <a href="${escapeHtml(args.trackingUrl)}" target="_blank" rel="noreferrer">${escapeHtml(args.trackingUrl)}</a></p>` : ''}
    </div>
    <div class="card">
      <p style="margin:0;">Customer: ${escapeHtml(args.order.customer_name)} (${escapeHtml(args.order.customer_email)})</p>
    </div>
  `;

  const adminHtml = buildEmailShell({
    title: 'AWB Assigned',
    subtitle: `Order ${args.order.order_number}`,
    bodyHtml: adminBody,
    theme: 'success',
  });

  await transporter.sendMail({
    from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
    to: args.order.customer_email,
    subject: `Tracking available - ${args.order.order_number}`,
    html: customerHtml,
  });

  await transporter.sendMail({
    from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || 'info@casebuddy.co.in',
    subject: `✅ AWB assigned - ${args.order.order_number}`,
    html: adminHtml,
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId, courierId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const prevAwb = shipment.shiprocket_awb ? String(shipment.shiprocket_awb) : null;

    const shipmentId = shipment.shiprocket_shipment_id;
    if (!shipmentId) return NextResponse.json({ error: 'Missing shiprocket_shipment_id' }, { status: 400 });

    const payload: any = { shipment_id: Number(shipmentId) };
    if (courierId) payload.courier_id = Number(courierId);

    try {
      const response = await shiprocketRequest<any>('/v1/external/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const { awb, courier } = extractAwbAndCourier(response);

      await caseMainPool.execute(
        `UPDATE shipments
         SET shiprocket_awb = COALESCE(?, shiprocket_awb),
             shiprocket_courier_id = COALESCE(?, shiprocket_courier_id),
             shiprocket_courier_name = COALESCE(?, shiprocket_courier_name),
             status = 'awb_assigned',
             response_json = ?
         WHERE order_id = ?`,
        [
          awb,
          courierId ? String(courierId) : null,
          courier,
          JSON.stringify(response),
          orderId,
        ]
      );

      const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);

      // Email customer/admin only when AWB becomes available (avoid duplicates on retry)
      try {
        const newAwb = awb || updated?.[0]?.shiprocket_awb || null;
        const becameAvailable = !!newAwb && !prevAwb;
        if (becameAvailable) {
          const [orderRows]: any = await caseMainPool.execute(
            'SELECT id, order_number, customer_name, customer_email, product_name, phone_model, quantity, customization_data FROM orders WHERE id = ? LIMIT 1',
            [orderId]
          );
          const order = orderRows?.[0] as OrderRow | undefined;
          if (order) {
            await sendAwbAssignedEmails({
              order,
              awb: String(newAwb),
              courierName: courier || updated?.[0]?.shiprocket_courier_name || null,
              trackingUrl: updated?.[0]?.tracking_url || null,
            });
          }
        }
      } catch {
        // ignore email errors
      }

      return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
    } catch (inner: any) {
      const errMsg = inner?.message || 'Failed to assign AWB';
      const payload = tryParseShiprocketErrorPayload(errMsg);
      const shiprocketMessage = typeof payload?.message === 'string' ? payload.message : '';
      const currentAwb = extractAwbFromText(shiprocketMessage) || extractAwbFromText(errMsg);

      // If Shiprocket says AWB is already assigned and cannot be reassigned, we still store/display it.
      if (currentAwb) {
        await caseMainPool.execute(
          `UPDATE shipments
           SET shiprocket_awb = COALESCE(shiprocket_awb, ?),
               status = 'awb_assigned',
               response_json = ?
           WHERE order_id = ?`,
          [currentAwb, JSON.stringify(payload || { error: errMsg }), orderId]
        );

        const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);

        // Email when AWB becomes available from an "already assigned" error case
        try {
          const becameAvailable = !prevAwb;
          if (becameAvailable) {
            const [orderRows]: any = await caseMainPool.execute(
              'SELECT id, order_number, customer_name, customer_email, product_name, phone_model, quantity, customization_data FROM orders WHERE id = ? LIMIT 1',
              [orderId]
            );
            const order = orderRows?.[0] as OrderRow | undefined;
            if (order) {
              await sendAwbAssignedEmails({
                order,
                awb: String(currentAwb),
                courierName: updated?.[0]?.shiprocket_courier_name || null,
                trackingUrl: updated?.[0]?.tracking_url || null,
              });
            }
          }
        } catch {
          // ignore email errors
        }

        return NextResponse.json({
          success: true,
          shipment: updated?.[0] || null,
          shiprocket: payload || { message: shiprocketMessage || errMsg },
          note: 'AWB already assigned in Shiprocket; reassignment blocked by courier restriction.',
        });
      }

      throw inner;
    }
  } catch (error: any) {
    const message = error?.message || 'Failed to assign AWB';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
