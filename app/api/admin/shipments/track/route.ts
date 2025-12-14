import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';
import { shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';

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

function extractAwbAndCourierFromTracking(response: any) {
  const td = response?.tracking_data;
  const awb = firstNonEmpty(
    response?.awb,
    response?.awb_code,
    getByPath(response, 'tracking_data.awb'),
    getByPath(response, 'tracking_data.awb_code'),
    getByPath(response, 'tracking_data.shipment_track.0.awb'),
    getByPath(response, 'tracking_data.shipment_track.0.awb_code')
  );

  const courier = firstNonEmpty(
    response?.courier_name,
    getByPath(response, 'tracking_data.courier_name'),
    getByPath(response, 'tracking_data.shipment_track.0.courier_name'),
    getByPath(response, 'tracking_data.shipment_track.0.courier_company_name')
  );

  return {
    awb: awb != null ? String(awb) : null,
    courier: courier != null ? String(courier) : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager', 'staff']);

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const awb = shipment.shiprocket_awb;
    if (!awb) return NextResponse.json({ error: 'Missing shiprocket_awb (assign AWB first)' }, { status: 400 });

    const response = await shiprocketRequest<any>(`/v1/external/courier/track/awb/${encodeURIComponent(String(awb))}`, {
      method: 'GET',
    });

    const trackingUrl = response?.tracking_url ?? response?.trackingUrl ?? shipment.tracking_url ?? null;
    const status =
      response?.tracking_data?.shipment_track?.[0]?.current_status ||
      response?.current_status ||
      response?.tracking_data?.shipment_status ||
      shipment.status ||
      null;

    const statusToSave = shiprocketStatusCodeToLabel(status) || status;

    const extracted = extractAwbAndCourierFromTracking(response);

    await caseMainPool.execute(
      `UPDATE shipments
       SET tracking_url = COALESCE(?, tracking_url),
           status = COALESCE(?, status),
           shiprocket_awb = COALESCE(shiprocket_awb, ?),
           shiprocket_courier_name = COALESCE(shiprocket_courier_name, ?),
           response_json = ?
       WHERE order_id = ?`,
      [
        trackingUrl ? String(trackingUrl) : null,
        statusToSave ? String(statusToSave) : null,
        extracted.awb,
        extracted.courier,
        JSON.stringify(response),
        orderId,
      ]
    );

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to track shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
