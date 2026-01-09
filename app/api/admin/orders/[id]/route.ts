import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Delete related shipments first (foreign key constraint)
    await pool.execute(
      'DELETE FROM shipments WHERE order_id = ?',
      [orderId]
    );

    // Delete the order
    const [result] = await pool.execute<any>(
      'DELETE FROM orders WHERE id = ?',
      [orderId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
