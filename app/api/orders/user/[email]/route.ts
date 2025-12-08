import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: encodedEmail } = await params;
    const email = decodeURIComponent(encodedEmail);

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
        customization_data,
        notes,
        created_at
      FROM orders 
      WHERE customer_email = ? 
      ORDER BY created_at DESC`,
      [email]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
