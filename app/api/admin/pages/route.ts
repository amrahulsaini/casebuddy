import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch all pages with section counts
export async function GET(req: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [pages] = await productsPool.query(`
      SELECT 
        p.*,
        COUNT(s.id) as section_count
      FROM pages p
      LEFT JOIN homepage_sections s ON s.page_id = p.id
      GROUP BY p.id
      ORDER BY p.sort_order ASC
    `);

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST: Create new page
export async function POST(req: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { page_key, page_name, slug, description, sort_order, is_active } = body;

    // Validate required fields
    if (!page_key || !page_name || !slug) {
      return NextResponse.json(
        { error: 'page_key, page_name, and slug are required' },
        { status: 400 }
      );
    }

    // Check if page_key or slug already exists
    const [existing]: any = await productsPool.query(
      'SELECT id FROM pages WHERE page_key = ? OR slug = ?',
      [page_key, slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Page key or slug already exists' },
        { status: 400 }
      );
    }

    // Insert new page
    const [result]: any = await productsPool.query(
      `INSERT INTO pages 
       (page_key, page_name, slug, description, sort_order, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        page_key,
        page_name,
        slug,
        description || null,
        sort_order || 0,
        is_active !== false ? 1 : 0
      ]
    );

    // Fetch and return the created page
    const [newPage]: any = await productsPool.query(
      'SELECT * FROM pages WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newPage[0], { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
