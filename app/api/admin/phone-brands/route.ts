import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const connection = await productsPool.getConnection();

    try {
      const [brands] = await connection.execute(
        'SELECT * FROM phone_brands ORDER BY sort_order, name'
      );

      return NextResponse.json(brands);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const data = await request.json();
    const connection = await productsPool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO phone_brands 
         (name, slug, logo_url, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.name,
          data.slug,
          data.logo_url || null,
          data.sort_order || 0,
          data.is_active ?? true,
        ]
      );

      return NextResponse.json({ success: true, id: (result as any).insertId });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
