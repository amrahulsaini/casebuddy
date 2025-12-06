import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');

    let query = 'SELECT * FROM phone_brands WHERE is_active = TRUE';
    const params: any[] = [];

    if (categoryId) {
      query = `
        SELECT DISTINCT pb.* 
        FROM phone_brands pb
        INNER JOIN category_phone_brands cpb ON pb.id = cpb.brand_id
        WHERE pb.is_active = TRUE AND cpb.category_id = ?
        ORDER BY pb.sort_order, pb.name
      `;
      params.push(categoryId);
    } else {
      query += ' ORDER BY sort_order, name';
    }

    const [brands]: any = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      brands: brands,
    });
  } catch (error: any) {
    console.error('Phone brands API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
