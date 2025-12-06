import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

    try {
      const [models] = await connection.execute(
        'SELECT * FROM phone_models WHERE brand_id = ? ORDER BY sort_order, model_name',
        [id]
      );

      return NextResponse.json({ success: true, models });
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const connection = await productsPool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO phone_models 
         (brand_id, model_name, slug, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          data.model_name,
          data.slug,
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
