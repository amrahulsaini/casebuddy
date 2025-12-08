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
      const [brands] = await connection.execute(
        `SELECT pb.* FROM phone_brands pb
         INNER JOIN category_phone_brands cpb ON pb.id = cpb.brand_id
         WHERE cpb.category_id = ?
         ORDER BY pb.sort_order, pb.name`,
        [id]
      );

      return NextResponse.json({ success: true, brands });
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const connection = await productsPool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete existing associations
      await connection.execute(
        'DELETE FROM category_phone_brands WHERE category_id = ?',
        [id]
      );

      // Insert new associations
      if (Array.isArray(data.brand_ids) && data.brand_ids.length > 0) {
        for (const brandId of data.brand_ids) {
          await connection.execute(
            'INSERT INTO category_phone_brands (category_id, brand_id) VALUES (?, ?)',
            [id, brandId]
          );
        }
      }

      await connection.commit();

      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
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
