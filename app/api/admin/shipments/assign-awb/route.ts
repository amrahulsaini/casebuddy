import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';
import { sendTrackingEmail } from '@/lib/tracking-email';

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

      // Send tracking email to customer when AWB is assigned
      const newAwb = awb || (updated?.[0]?.shiprocket_awb ? String(updated[0].shiprocket_awb) : null);
      const trackingUrl = updated?.[0]?.tracking_url ? String(updated[0].tracking_url) : undefined;
      
      if (newAwb && newAwb !== prevAwb) {
        try {
          const [orderRows]: any = await caseMainPool.execute(
            'SELECT order_number, customer_name, customer_email FROM orders WHERE id = ? LIMIT 1',
            [orderId]
          );
          if (orderRows.length > 0) {
            const order = orderRows[0];
            await sendTrackingEmail(
              orderId,
              order.order_number,
              order.customer_email,
              order.customer_name,
              newAwb,
              trackingUrl
            );
          }
        } catch (emailError) {
          console.error('Failed to send tracking email:', emailError);
          // Don't fail the request if email fails
        }
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

        // Send tracking email when AWB becomes available from error case
        const trackingUrl = updated?.[0]?.tracking_url ? String(updated[0].tracking_url) : undefined;
        if (currentAwb && currentAwb !== prevAwb) {
          try {
            const [orderRows]: any = await caseMainPool.execute(
              'SELECT order_number, customer_name, customer_email FROM orders WHERE id = ? LIMIT 1',
              [orderId]
            );
            if (orderRows.length > 0) {
              const order = orderRows[0];
              await sendTrackingEmail(
                orderId,
                order.order_number,
                order.customer_email,
                order.customer_name,
                currentAwb,
                trackingUrl
              );
            }
          } catch (emailError) {
            console.error('Failed to send tracking email:', emailError);
          }
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
