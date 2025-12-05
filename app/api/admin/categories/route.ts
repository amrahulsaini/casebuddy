import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const connection = await pool.getConnection();

    try {
      const [categories] = await connection.execute(
        'SELECT * FROM categories ORDER BY sort_order, name'
      );

      return NextResponse.json(categories);
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

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const data = await request.json();
    const connection = await productsPool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO categories 
         (name, slug, description, image_url, parent_id, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.slug,
          data.description || '',
          data.image_url || null,
          data.parent_id || null,
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
