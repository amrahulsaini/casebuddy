import { NextRequest, NextResponse } from 'next/server';
import { caseMainPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    // Fetch page details
    const [pageRows]: any = await caseMainPool.query(
      `SELECT id, page_key, page_name, slug, description, is_active 
       FROM pages 
       WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    if (!pageRows || pageRows.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const page = pageRows[0];

    // Fetch sections for this page
    const [sectionRows]: any = await caseMainPool.query(
      `SELECT id, section_key, title, subtitle, icon, sort_order, is_active
       FROM homepage_sections
       WHERE page_id = ? AND is_active = 1
       ORDER BY sort_order ASC`,
      [page.id]
    );

    // Fetch categories and products for each section
    const sections = await Promise.all(
      (sectionRows || []).map(async (section: any) => {
        // Get categories for this section
        const [categoryRows]: any = await caseMainPool.query(
          `SELECT id, name, slug, description, icon, is_active
           FROM categories
           WHERE section_key = ? AND is_active = 1 AND parent_id IS NULL
           ORDER BY sort_order ASC`,
          [section.section_key]
        );

        // Get products for each category
        const categories = await Promise.all(
          (categoryRows || []).map(async (category: any) => {
            const [productRows]: any = await caseMainPool.query(
              `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock_quantity,
                      pi.image_url, pi.alt_text
               FROM products p
               LEFT JOIN product_categories pc ON p.id = pc.product_id
               LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
               WHERE pc.category_id = ? AND p.is_active = 1
               ORDER BY p.created_at DESC
               LIMIT 12`,
              [category.id]
            );

            return {
              ...category,
              products: productRows || []
            };
          })
        );

        return {
          ...section,
          categories
        };
      })
    );

    return NextResponse.json({
      page: {
        id: page.id,
        page_key: page.page_key,
        page_name: page.page_name,
        slug: page.slug,
        description: page.description
      },
      sections
    });
  } catch (error) {
    console.error('Error fetching page data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page data' },
      { status: 500 }
    );
  }
}
