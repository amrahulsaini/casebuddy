import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const [rows]: any = await caseMainPool.execute(
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
