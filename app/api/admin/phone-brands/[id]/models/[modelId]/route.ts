import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  try {
    await requireAdmin();
    const { id, modelId } = await params;
    const data = await request.json();

    const connection = await productsPool.getConnection();

    try {
      await connection.execute(
        `UPDATE phone_models 
         SET model_name = ?, slug = ?, sort_order = ?, is_active = ?
         WHERE id = ? AND brand_id = ?`,
        [
          data.model_name,
          data.slug,
          data.sort_order || 0,
          data.is_active ?? true,
          modelId,
          id,
        ]
      );

      return NextResponse.json({ success: true });
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  try {
    await requireAdmin();
    const { id, modelId } = await params;

    const connection = await productsPool.getConnection();

    try {
      await connection.execute(
        'DELETE FROM phone_models WHERE id = ? AND brand_id = ?',
        [modelId, id]
      );

      return NextResponse.json({ success: true });
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
