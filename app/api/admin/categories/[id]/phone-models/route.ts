import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

    try {
      const [models] = await connection.execute(
        `SELECT pm.* 
         FROM phone_models pm
         JOIN category_phone_models cpm ON pm.id = cpm.phone_model_id
         WHERE cpm.category_id = ?
         ORDER BY pm.model_name`,
        [id]
      );

      return NextResponse.json({ success: true, models });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { model_ids } = await request.json();

    const connection = await productsPool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete existing models for this category
      await connection.execute(
        'DELETE FROM category_phone_models WHERE category_id = ?',
        [id]
      );

      // Insert new models
      if (model_ids && model_ids.length > 0) {
        const values = model_ids.map((modelId: number) => [id, modelId]);
        await connection.query(
          'INSERT INTO category_phone_models (category_id, phone_model_id) VALUES ?',
          [values]
        );
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
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
