import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const connection = await pool.getConnection();

    try {
      await connection.execute(
        `UPDATE categories SET
         name = ?, slug = ?, description = ?, image_url = ?,
         parent_id = ?, sort_order = ?, is_active = ?
         WHERE id = ?`,
        [
          data.name,
          data.slug,
          data.description || '',
          data.image_url || null,
          data.parent_id || null,
          data.sort_order || 0,
          data.is_active ?? true,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await pool.getConnection();

    try {
      await connection.execute('DELETE FROM categories WHERE id = ?', [id]);
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
