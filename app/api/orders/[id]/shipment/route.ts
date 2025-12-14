import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

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
        tracking_url,
        label_url,
        updated_at
      FROM shipments
      WHERE order_id = ?
      LIMIT 1`,
      [orderId]
    );

    return NextResponse.json(rows?.[0] || null);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}
