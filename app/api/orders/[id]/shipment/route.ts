import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { shiprocketRequest } from '@/lib/shiprocket';

function safeJsonParse(value: any) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function pickString(value: any) {
  if (value == null) return null;
  const s = String(value);
  return s.trim() ? s : null;
}

type PublicTrackingEvent = {
  date: string | null;
  location: string | null;
  status: string | null;
  message: string | null;
};

function extractTrackingEvents(shiprocketResponse: any): PublicTrackingEvent[] {
  const td = shiprocketResponse?.tracking_data;
  const activities = Array.isArray(td?.shipment_track_activities) ? td.shipment_track_activities : null;
  const track = Array.isArray(td?.shipment_track) ? td.shipment_track : null;

  const raw = activities || track || [];
  return raw
    .map((e: any) => {
      const date = pickString(e?.date) || pickString(e?.activity_date) || pickString(e?.updated_at) || null;
      const location = pickString(e?.location) || pickString(e?.current_location) || null;
      const status =
        pickString(e?.status) ||
        pickString(e?.current_status) ||
        pickString(e?.activity) ||
        pickString(e?.remark) ||
        null;
      const message = pickString(e?.message) || pickString(e?.remarks) || pickString(e?.sr_status_label) || null;
      return { date, location, status, message };
    })
    .filter((e: PublicTrackingEvent) => e.date || e.location || e.status || e.message)
    .slice(0, 15);
}

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

    // Auto-refresh tracking from Shiprocket if we have an AWB and the cached data is old.
    // This makes customer view update automatically after "Ship Now" without requiring admin clicks.
    const awb = shipment.shiprocket_awb ? String(shipment.shiprocket_awb).trim() : '';
    const refreshMins = Number(process.env.SHIPROCKET_CUSTOMER_REFRESH_MINS || '10');
    if (awb && shouldRefresh(shipment.updated_at, refreshMins)) {
      try {
        const response = await shiprocketRequest<any>(
          `/v1/external/courier/track/awb/${encodeURIComponent(String(awb))}`,
          { method: 'GET' }
        );

        const trackingUrl = response?.tracking_url ?? response?.trackingUrl ?? shipment.tracking_url ?? null;
        const shipStatus =
          response?.tracking_data?.shipment_status ||
          response?.tracking_data?.shipment_track?.[0]?.current_status ||
          shipment.status ||
          null;
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

    const parsed = safeJsonParse(shipment.response_json);
    const events = parsed ? extractTrackingEvents(parsed) : [];
    const currentStatus =
      pickString(parsed?.tracking_data?.shipment_status) ||
      pickString(parsed?.tracking_data?.shipment_track?.[0]?.current_status) ||
      null;

    return NextResponse.json({
      id: shipment.id,
      order_id: shipment.order_id,
      status: shipment.status,
      shiprocket_awb: shipment.shiprocket_awb,
      shiprocket_courier_name: shipment.shiprocket_courier_name,
      tracking_url: shipment.tracking_url,
      updated_at: shipment.updated_at,
      current_status: currentStatus,
      events,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}
