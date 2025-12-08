import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM orders'
    );
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const [rows] = await pool.execute(
      `SELECT 
        id,
        order_number,
        customer_email,
        customer_mobile,
        customer_name,
        product_name,
        phone_model,
        quantity,
        total_amount,
        order_status,
        payment_status,
        created_at
      FROM orders 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return NextResponse.json({
      orders: rows,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
