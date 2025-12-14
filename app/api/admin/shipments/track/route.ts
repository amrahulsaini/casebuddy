import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';

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
      response?.tracking_data?.shipment_status ||
      response?.tracking_data?.shipment_track?.[0]?.current_status ||
      shipment.status ||
      null;

    await caseMainPool.execute(
      `UPDATE shipments
       SET tracking_url = COALESCE(?, tracking_url),
           status = COALESCE(?, status),
           response_json = ?
       WHERE order_id = ?`,
      [trackingUrl ? String(trackingUrl) : null, status ? String(status) : null, JSON.stringify(response), orderId]
    );

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to track shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
