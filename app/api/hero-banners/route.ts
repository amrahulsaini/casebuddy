import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM hero_banners WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
