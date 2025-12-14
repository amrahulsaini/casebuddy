import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { shiprocketRequest } from '@/lib/shiprocket';
import { shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';

function normalizeEmail(value: any) {
  return String(value || '').trim().toLowerCase();
}

function shouldRefresh(updatedAt: any, minutes: number) {
  if (!updatedAt) return true;
  const t = new Date(updatedAt).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > minutes * 60 * 1000;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Lightweight auth: require matching customer email (sent from client).
    // This prevents random callers from enumerating order IDs and triggering Shiprocket API calls.
    const requestEmail =
      normalizeEmail(request.headers.get('x-customer-email')) ||
      normalizeEmail(new URL(request.url).searchParams.get('email'));

    if (!requestEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [orderRows]: any = await caseMainPool.execute('SELECT customer_email FROM orders WHERE id = ? LIMIT 1', [
      orderId,
    ]);
    const orderEmail = normalizeEmail(orderRows?.[0]?.customer_email);
    if (!orderEmail || orderEmail !== requestEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Public endpoint (customer side) — do not expose raw payload_json/response_json.
    const [rows]: any = await caseMainPool.execute(
      `SELECT
        id,
        order_id,
        status,
        shiprocket_awb,
        shiprocket_courier_name,
        tracking_url,
        updated_at,
        response_json
      FROM shipments
      WHERE order_id = ?
      LIMIT 1`,
      [orderId]
    );

    const shipment = rows?.[0] || null;
    if (!shipment) return NextResponse.json(null);

    // IMPORTANT: Customer view should reflect only what admin has synced.
    // Auto-refresh is disabled by default; enable only if explicitly configured.
    const allowCustomerAutoRefresh = String(process.env.SHIPROCKET_CUSTOMER_AUTO_REFRESH || '').trim() === '1';

    const awb = shipment.shiprocket_awb ? String(shipment.shiprocket_awb).trim() : '';
    const refreshMins = Number(process.env.SHIPROCKET_CUSTOMER_REFRESH_MINS || '10');
    if (allowCustomerAutoRefresh && awb && shouldRefresh(shipment.updated_at, refreshMins)) {
      try {
        const response = await shiprocketRequest<any>(
          `/v1/external/courier/track/awb/${encodeURIComponent(String(awb))}`,
          { method: 'GET' }
        );

        const trackingUrl = response?.tracking_url ?? response?.trackingUrl ?? shipment.tracking_url ?? null;
        const shipStatusRaw =
          response?.tracking_data?.shipment_track?.[0]?.current_status ||
          response?.current_status ||
          response?.tracking_data?.shipment_status ||
          shipment.status ||
          null;
        const shipStatus = shiprocketStatusCodeToLabel(shipStatusRaw) || shipStatusRaw;
        const courierName =
          response?.courier_name || response?.courierName || response?.tracking_data?.courier_name || shipment.shiprocket_courier_name || null;

        await caseMainPool.execute(
          `UPDATE shipments
           SET tracking_url = COALESCE(?, tracking_url),
               shiprocket_courier_name = COALESCE(shiprocket_courier_name, ?),
               status = COALESCE(?, status),
               response_json = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [
            trackingUrl ? String(trackingUrl) : null,
            courierName ? String(courierName) : null,
            shipStatus ? String(shipStatus) : null,
            JSON.stringify(response),
            shipment.id,
          ]
        );

        shipment.tracking_url = shipment.tracking_url || (trackingUrl ? String(trackingUrl) : null);
        shipment.shiprocket_courier_name = shipment.shiprocket_courier_name || (courierName ? String(courierName) : null);
        shipment.status = shipStatus ? String(shipStatus) : shipment.status;
        shipment.response_json = response;
        shipment.updated_at = new Date().toISOString();
      } catch {
        // Ignore Shiprocket failures and return cached data.
      }
    }

    // Customer-side response: only expose the absolute minimum.
    return NextResponse.json({
      shiprocket_awb: shipment.shiprocket_awb,
      tracking_url: shipment.tracking_url,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}
