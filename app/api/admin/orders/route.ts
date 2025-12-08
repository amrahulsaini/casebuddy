import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET() {
  try {
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
      ORDER BY created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
