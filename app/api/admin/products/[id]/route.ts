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
      const [products] = await connection.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if ((products as any[]).length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const product = (products as any[])[0];

      // Parse customization_options if it's a string
      if (product.customization_options && typeof product.customization_options === 'string') {
        try {
          product.customization_options = JSON.parse(product.customization_options);
        } catch (e) {
          product.customization_options = null;
        }
      }

      // Get categories
      const [categories] = await connection.execute(
        `SELECT c.* FROM categories c
         JOIN product_categories pc ON c.id = pc.category_id
         WHERE pc.product_id = ?`,
        [id]
      );

      // Get images
      const [images] = await connection.execute(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
        [id]
      );

      return NextResponse.json({
        ...product,
        categories,
        images,
      });
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

      // Update product
      await connection.execute(
        `UPDATE products SET
         name = ?, slug = ?, description = ?, short_description = ?,
         price = ?, compare_price = ?, sku = ?, stock_quantity = ?,
         is_featured = ?, is_active = ?, design_addon_enabled = ?
         WHERE id = ?`,
        [
          data.name,
          data.slug,
          data.description || '',
          data.short_description || '',
          data.price,
          data.compare_price || null,
          data.sku || '',
          data.stock_quantity || 0,
          data.is_featured || false,
          data.is_active ?? true,
          data.design_addon_enabled || false,
          id,
        ]
      );

      // Update categories
      if (data.categories) {
        await connection.execute('DELETE FROM product_categories WHERE product_id = ?', [id]);
        for (const categoryId of data.categories) {
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
            [id, categoryId]
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

    try {
      await connection.execute('DELETE FROM products WHERE id = ?', [id]);
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
