import { NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';

interface Section {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  icon: string;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

export async function GET() {
  try {
    // Get active homepage sections
    const [sections] = await caseMainPool.execute<any[]>(
      'SELECT * FROM homepage_sections WHERE is_active = TRUE ORDER BY sort_order ASC'
    );

    // For each section, get its categories
    const sectionsWithCategories = await Promise.all(
      (sections as Section[]).map(async (section) => {
        const [categories] = await caseMainPool.execute<any[]>(
          `SELECT id, name, slug, image_url, sort_order 
           FROM categories 
           WHERE is_active = TRUE 
           AND parent_id IS NULL 
           AND section_key = ? 
           ORDER BY sort_order ASC`,
          [section.section_key]
        );

        return {
          ...section,
          categories: categories as Category[]
        };
      })
    );

    return NextResponse.json(sectionsWithCategories);
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json([], { status: 500 });
  }
}
