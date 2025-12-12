import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    console.log('Search query received:', query);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    console.log('Searching with term:', searchTerm);

    // Search categories - case insensitive
    const [categories]: any = await productsPool.execute(
      `SELECT id, name, slug, image_url, 'category' as type 
       FROM categories 
       WHERE (LOWER(name) LIKE ? OR LOWER(slug) LIKE ?) AND is_active = 1
       ORDER BY 
         CASE 
           WHEN LOWER(name) = LOWER(?) THEN 1
           WHEN LOWER(name) LIKE ? THEN 2
           ELSE 3
         END,
         name ASC
       LIMIT 10`,
      [searchTerm, searchTerm, query, `${query.toLowerCase()}%`]
    );

    console.log('Categories found:', categories.length);

    // Search products with their primary category - case insensitive
    const [products]: any = await productsPool.execute(
      `SELECT DISTINCT p.id, p.name, p.slug, pi.image_url, 'product' as type, c.slug as category_slug, c.name as category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.id = pc.product_id
       LEFT JOIN categories c ON pc.category_id = c.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       WHERE (LOWER(p.name) LIKE ? OR LOWER(p.slug) LIKE ? OR LOWER(p.description) LIKE ?) AND p.is_active = 1
       ORDER BY 
         CASE 
           WHEN LOWER(p.name) = LOWER(?) THEN 1
           WHEN LOWER(p.name) LIKE ? THEN 2
           ELSE 3
         END,
         p.name ASC
       LIMIT 15`,
      [searchTerm, searchTerm, searchTerm, query, `${query.toLowerCase()}%`]
    );

    console.log('Products found:', products.length);

    // Combine results
    const results = [
      ...categories.map((c: any) => ({ ...c, type: 'category' })),
      ...products.map((p: any) => ({ ...p, type: 'product' }))
    ];

    console.log('Total results:', results.length);

    return NextResponse.json({ 
      success: true, 
      results,
      total: results.length 
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error', results: [] },
      { status: 500 }
    );
  }
}
