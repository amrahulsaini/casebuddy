import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    let query: string;
    const params: any[] = [];

    // When filtering by category, get sort_order from that specific category
    if (categorySlug) {
      query = `
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
          c.slug AS category_slug,
          c.name AS category_name,
          pc.sort_order
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        INNER JOIN categories c ON pc.category_id = c.id AND c.slug = ?
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        WHERE p.is_active = TRUE
      `;
      params.push(categorySlug);
    } else {
      // When not filtering, get sort_order from first category
      query = `
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
          cat.category_name,
          cat.sort_order
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        LEFT JOIN (
          SELECT
            pc.product_id,
            MIN(c.slug) AS category_slug,
            MIN(c.name) AS category_name,
            MIN(pc.sort_order) AS sort_order
          FROM product_categories pc
          JOIN categories c ON pc.category_id = c.id
          GROUP BY pc.product_id
        ) cat ON cat.product_id = p.id
        WHERE p.is_active = TRUE
      `;
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

    // Order by sort_order - use direct column if filtering by category, else use cat alias
    if (categorySlug) {
      query += ` ORDER BY pc.sort_order ASC, p.created_at DESC`;
    } else {
      query += ` ORDER BY cat.sort_order ASC, p.created_at DESC`;
    }
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET ?`;
      params.push(offset);
    }

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
