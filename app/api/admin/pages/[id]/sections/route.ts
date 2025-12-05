import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch all sections for a specific page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [sections] = await productsPool.query(`
      SELECT 
        s.*,
        COUNT(c.id) as category_count
      FROM homepage_sections s
      LEFT JOIN categories c ON c.section_key = s.section_key AND c.parent_id IS NULL
      WHERE s.page_id = ?
      GROUP BY s.id
      ORDER BY s.sort_order ASC
    `, [id]);

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}
