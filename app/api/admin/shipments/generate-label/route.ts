import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const currentStatus = String(shipment.status || '').trim().toLowerCase();
    if (currentStatus === 'cancelled') {
      return NextResponse.json(
        { error: 'Shipment is cancelled. Cannot generate label.' },
        { status: 400 }
      );
    }

    const shipmentId = shipment.shiprocket_shipment_id;
    if (!shipmentId) return NextResponse.json({ error: 'Missing shiprocket_shipment_id' }, { status: 400 });

    const response = await shiprocketRequest<any>('/v1/external/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
    });

    const labelUrl = response?.label_url ?? response?.label_created ?? response?.labelUrl ?? null;

    await caseMainPool.execute(
      `UPDATE shipments
       SET label_url = COALESCE(?, label_url),
           status = 'label_generated',
           response_json = ?
       WHERE order_id = ?`,
      [labelUrl ? String(labelUrl) : null, JSON.stringify(response), orderId]
    );

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate label';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
