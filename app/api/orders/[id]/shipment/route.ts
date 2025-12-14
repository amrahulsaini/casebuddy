import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

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
