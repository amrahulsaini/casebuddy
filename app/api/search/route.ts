import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query}%`;

    // Search categories
    const [categories]: any = await productsPool.execute(
      `SELECT id, name, slug, 'category' as type 
       FROM categories 
       WHERE (name LIKE ? OR slug LIKE ?) AND is_active = 1
       ORDER BY name ASC
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    // Search products
    const [products]: any = await productsPool.execute(
      `SELECT id, name, slug, 'product' as type 
       FROM products 
       WHERE (name LIKE ? OR slug LIKE ?) AND is_active = 1
       ORDER BY name ASC
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    // Combine results
    const results = [
      ...categories.map((c: any) => ({ ...c, type: 'category' })),
      ...products.map((p: any) => ({ ...p, type: 'product' }))
    ];

    return NextResponse.json({ 
      success: true, 
      results,
      total: results.length 
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
