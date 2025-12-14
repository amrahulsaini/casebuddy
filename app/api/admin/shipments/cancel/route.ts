import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';

type OrderRow = {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  order_status: string | null;
  product_name: string;
  phone_model: string;
  quantity: number;
  customization_data: string | null;
};

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const shiprocketOrderId = shipment.shiprocket_order_id;
    const shiprocketShipmentId = shipment.shiprocket_shipment_id;

    // Shiprocket cancel can accept order ids; this varies by API. We try order id first.
    const payload: any = {};
    if (shiprocketOrderId) payload.ids = [String(shiprocketOrderId)];
    else if (shiprocketShipmentId) payload.ids = [String(shiprocketShipmentId)];
    else return NextResponse.json({ error: 'No Shiprocket order/shipment id to cancel' }, { status: 400 });

    const response = await shiprocketRequest<any>('/v1/external/orders/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await caseMainPool.execute(
      `UPDATE shipments
       SET status = 'cancelled',
           response_json = ?
       WHERE order_id = ?`,
      [JSON.stringify(response), orderId]
    );

    const [orderRows]: any = await caseMainPool.execute(
      'SELECT id, order_number, customer_email, customer_name, order_status, product_name, phone_model, quantity, customization_data FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    const order = orderRows?.[0] as OrderRow | undefined;

    // Mark order cancelled (if not already terminal)
    if (order && String(order.order_status || '').toLowerCase() !== 'cancelled') {
      await caseMainPool.execute(
        `UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        [orderId]
      );
    }

    // Emails disabled (confirmation-only policy)

    const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, shipment: updated?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to cancel shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
