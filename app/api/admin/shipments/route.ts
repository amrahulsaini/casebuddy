import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager', 'staff']);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const [rows]: any = await caseMainPool.execute(
      'SELECT * FROM shipments WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    return NextResponse.json(rows?.[0] || null);
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch shipment';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
