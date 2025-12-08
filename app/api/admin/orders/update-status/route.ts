import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderStatus } = await request.json();

    await pool.execute(
      `UPDATE orders 
       SET order_status = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [orderStatus, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
