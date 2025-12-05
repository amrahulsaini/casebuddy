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
    // Get categories grouped by section for homepage
    const [customRows] = await caseMainPool.execute<any[]>(
      "SELECT id, name, slug, image_url, sort_order FROM categories WHERE is_active = TRUE AND parent_id IS NULL AND section = 'custom_cases' ORDER BY sort_order ASC"
    );
    
    const [regularRows] = await caseMainPool.execute<any[]>(
      "SELECT id, name, slug, image_url, sort_order FROM categories WHERE is_active = TRUE AND parent_id IS NULL AND section = 'device_categories' ORDER BY sort_order ASC"
    );
    
    return NextResponse.json({
      custom: customRows as Category[],
      regular: regularRows as Category[]
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ custom: [], regular: [] }, { status: 500 });
  }
}
