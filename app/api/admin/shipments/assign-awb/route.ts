import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId, courierId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const shipmentId = shipment.shiprocket_shipment_id;
    if (!shipmentId) return NextResponse.json({ error: 'Missing shiprocket_shipment_id' }, { status: 400 });

    const payload: any = { shipment_id: Number(shipmentId) };
    if (courierId) payload.courier_id = Number(courierId);

    const response = await shiprocketRequest<any>('/v1/external/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const awb = response?.awb_code ?? response?.awb ?? null;
    const courier = response?.courier_name ?? response?.courierName ?? null;

    await caseMainPool.execute(
      `UPDATE shipments
       SET shiprocket_awb = COALESCE(?, shiprocket_awb),
           shiprocket_courier_id = COALESCE(?, shiprocket_courier_id),
           shiprocket_courier_name = COALESCE(?, shiprocket_courier_name),
           status = 'awb_assigned',
           response_json = CAST(? AS JSON)
       WHERE order_id = ?`,
      [
        awb ? String(awb) : null,
        courierId ? String(courierId) : null,
        courier ? String(courier) : null,
        JSON.stringify(response),
        orderId,
      ]
    );

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to assign AWB';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
