import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

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

      // Update category basic info
      await connection.execute(
        `UPDATE categories SET
         name = ?, slug = ?, description = ?, image_url = ?,
         parent_id = ?, section_key = ?, sort_order = ?, is_active = ?,
         customization_enabled = ?, customization_options = ?
         WHERE id = ?`,
        [
          data.name,
          data.slug,
          data.description || '',
          data.image_url || null,
          data.parent_id || null,
          data.section_key || null,
          data.sort_order || 0,
          data.is_active ?? true,
          data.customization_enabled ?? false,
          data.customization_options ? JSON.stringify(data.customization_options) : null,
          id,
        ]
      );

      // Update phone brands association
      if (data.phone_brands !== undefined) {
        // Delete existing associations
        await connection.execute(
          'DELETE FROM category_phone_brands WHERE category_id = ?',
          [id]
        );

        // Insert new associations
        if (Array.isArray(data.phone_brands) && data.phone_brands.length > 0) {
          for (const brandId of data.phone_brands) {
            await connection.execute(
              'INSERT INTO category_phone_brands (category_id, brand_id) VALUES (?, ?)',
              [id, brandId]
            );
          }
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

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
