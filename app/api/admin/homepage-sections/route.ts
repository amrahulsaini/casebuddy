import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch all homepage sections with category counts
export async function GET(req: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [sections] = await productsPool.query(`
      SELECT 
        s.*,
        COUNT(c.id) as category_count
      FROM homepage_sections s
      LEFT JOIN categories c ON c.section_key = s.section_key AND c.parent_id IS NULL
      GROUP BY s.id
      ORDER BY s.sort_order ASC
    `);

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage sections' },
      { status: 500 }
    );
  }
}

// POST: Create new homepage section
export async function POST(req: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { page_id, section_key, title, subtitle, icon, sort_order, is_active } = body;

    // Validate required fields
    if (!page_id || !section_key || !title) {
      return NextResponse.json(
        { error: 'page_id, section_key and title are required' },
        { status: 400 }
      );
    }

    // Check if section_key already exists
    const [existing]: any = await productsPool.query(
      'SELECT id FROM homepage_sections WHERE section_key = ?',
      [section_key]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Section key already exists' },
        { status: 400 }
      );
    }

    // Insert new section
    const [result]: any = await productsPool.query(
      `INSERT INTO homepage_sections 
       (page_id, section_key, title, subtitle, icon, sort_order, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        page_id,
        section_key,
        title,
        subtitle || null,
        icon || null,
        sort_order || 0,
        is_active !== false ? 1 : 0
      ]
    );

    // Fetch and return the created section
    const [newSection]: any = await productsPool.query(
      'SELECT * FROM homepage_sections WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newSection[0], { status: 201 });
  } catch (error) {
    console.error('Error creating homepage section:', error);
    return NextResponse.json(
      { error: 'Failed to create homepage section' },
      { status: 500 }
    );
  }
}
