import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [categories]: any = await pool.execute(
      `SELECT id, name, slug, description, parent_id, sort_order
       FROM categories
       WHERE slug = ? AND is_active = TRUE`,
      [slug]
    );

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: categories[0],
    });
  } catch (error: any) {
    console.error('Category API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
