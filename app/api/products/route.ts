import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

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
        pi.alt_text
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
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

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [products]: any = await pool.execute(query, params);

    // Convert numeric fields from strings to numbers
    const sanitizedProducts = Array.isArray(products) ? products.map((p: any) => ({
      ...p,
      id: Number(p.id),
      price: parseFloat(p.price),
      compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
      is_featured: Boolean(p.is_featured),
    })) : [];

    return NextResponse.json({
      success: true,
      products: sanitizedProducts,
      count: sanitizedProducts.length,
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
