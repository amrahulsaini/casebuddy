import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ success: false, error: 'No product IDs provided' });
    }

    const productIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await caseMainPool.execute<any[]>(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.compare_price,
        p.stock_quantity,
        pi.image_url,
        c.slug as category_slug
      FROM products p
      LEFT JOIN (
        SELECT product_id, image_url
        FROM product_images
        WHERE is_primary = TRUE
        GROUP BY product_id
      ) pi ON p.id = pi.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id IN (${placeholders})
      AND p.is_active = TRUE
      GROUP BY p.id`,
      productIds
    );

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching wishlist products:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
