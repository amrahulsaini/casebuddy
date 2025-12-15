import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.price,
        p.compare_price,
        p.is_featured,
        pi.image_url,
        pi.alt_text,
        cat.category_slug,
        cat.category_name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN (
        SELECT
          pc.product_id,
          MIN(c.slug) AS category_slug,
          MIN(c.name) AS category_name
        FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        GROUP BY pc.product_id
      ) cat ON cat.product_id = p.id
      WHERE p.is_active = TRUE
    `;

    const params: any[] = [];

    // Filter by category
    if (categorySlug) {
      query += ` AND p.id IN (
        SELECT pc.product_id FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE c.slug = ?
      )`;
      params.push(categorySlug);
    }

    // Filter by featured
    if (featured === 'true') {
      query += ` AND p.is_featured = TRUE`;
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.is_active = TRUE
    `;
    const countParams: any[] = [];

    if (categorySlug) {
      countQuery += ` AND p.id IN (
        SELECT pc.product_id FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE c.slug = ?
      )`;
      countParams.push(categorySlug);
    }

    if (featured === 'true') {
      countQuery += ` AND p.is_featured = TRUE`;
    }

    const [countResult]: any = await pool.execute(countQuery, countParams);
    const total = Number(countResult[0]?.total || 0);

    query += ` ORDER BY p.created_at DESC`;

    const [products]: any = await pool.execute(query, params);

    // Convert numeric fields from strings to numbers
    const sanitizedProducts = Array.isArray(products) ? products.map((p: any) => ({
      ...p,
      id: Number(p.id),
      price: parseFloat(p.price),
      compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
      is_featured: Boolean(p.is_featured),
      category_slug: p.category_slug != null ? String(p.category_slug) : null,
      category_name: p.category_name != null ? String(p.category_name) : null,
    })) : [];

    return NextResponse.json({
      success: true,
      products: sanitizedProducts,
      count: sanitizedProducts.length,
      total: total,
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
