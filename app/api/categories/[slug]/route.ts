import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [categories]: any = await pool.execute(
      `SELECT id, name, slug, description, parent_id, sort_order, customization_enabled, customization_options
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

    const category = categories[0];

    // Parse customization_options if it exists
    if (category.customization_options && typeof category.customization_options === 'string') {
      try {
        category.customization_options = JSON.parse(category.customization_options);
      } catch (e) {
        category.customization_options = null;
      }
    }

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        customization_enabled: Boolean(category.customization_enabled),
      },
    });
  } catch (error: any) {
    console.error('Category API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
