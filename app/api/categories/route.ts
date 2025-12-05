import { NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

export async function GET() {
  try {
    // Get only parent categories (parent_id IS NULL) for homepage
    const [rows] = await caseMainPool.execute<any[]>(
      'SELECT id, name, slug, image_url, sort_order FROM categories WHERE is_active = TRUE AND parent_id IS NULL ORDER BY sort_order ASC'
    );
    
    // Split first 8 for section 1, rest for section 2 (based on sort_order)
    const allCategories = rows as Category[];
    
    return NextResponse.json({
      custom: allCategories.slice(0, 8),
      regular: allCategories.slice(8)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ custom: [], regular: [] }, { status: 500 });
  }
}
