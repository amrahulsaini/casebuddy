import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    const connection = await productsPool.getConnection();

    try {
      let query = `
        SELECT 
          p.*,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          pi.image_url as primary_image
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category) {
        query += ` AND c.slug = ?`;
        params.push(category);
      }

      query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [products] = await connection.execute(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM products p`;
      if (category || search) {
        countQuery += ` LEFT JOIN product_categories pc ON p.id = pc.product_id
                       LEFT JOIN categories c ON pc.category_id = c.id
                       WHERE 1=1`;
        const countParams: any[] = [];
        if (search) {
          countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
          countParams.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
          countQuery += ` AND c.slug = ?`;
          countParams.push(category);
        }
        const [countResult] = await connection.execute(countQuery, countParams);
        var total = (countResult as any[])[0].total;
      } else {
        const [countResult] = await connection.execute(countQuery);
        var total = (countResult as any[])[0].total;
      }

      return NextResponse.json({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
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
      await connection.beginTransaction();

      // Insert product
      const [result] = await connection.execute(
        `INSERT INTO products 
         (name, slug, description, short_description, price, compare_price, sku, stock_quantity, is_featured, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ]
      );

      const productId = (result as any).insertId;

      // Add categories
      if (data.categories && data.categories.length > 0) {
        for (const categoryId of data.categories) {
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
            [productId, categoryId]
          );
        }
      }

      // Add primary image
      if (data.image_url) {
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, ?, ?, TRUE)',
          [productId, data.image_url, data.name]
        );
      }

      await connection.commit();

      return NextResponse.json({ success: true, productId: productId });
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
