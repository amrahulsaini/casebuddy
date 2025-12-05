import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PUT: Update page
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { page_name, slug, description, sort_order, is_active } = body;

    // Validate required fields
    if (!page_name || !slug) {
      return NextResponse.json(
        { error: 'page_name and slug are required' },
        { status: 400 }
      );
    }

    // Check if page exists
    const [existing]: any = await productsPool.query(
      'SELECT id FROM pages WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another page
    const [slugCheck]: any = await productsPool.query(
      'SELECT id FROM pages WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if (slugCheck.length > 0) {
      return NextResponse.json(
        { error: 'Slug already in use' },
        { status: 400 }
      );
    }

    // Update page (page_key cannot be changed)
    await productsPool.query(
      `UPDATE pages 
       SET page_name = ?, slug = ?, description = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        page_name,
        slug,
        description || null,
        sort_order || 0,
        is_active !== false ? 1 : 0,
        id
      ]
    );

    // Fetch and return the updated page
    const [updated]: any = await productsPool.query(
      'SELECT * FROM pages WHERE id = ?',
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE: Delete page
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if page exists and is not homepage
    const [page]: any = await productsPool.query(
      'SELECT page_key FROM pages WHERE id = ?',
      [id]
    );

    if (page.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of homepage
    if (page[0].page_key === 'homepage') {
      return NextResponse.json(
        { error: 'Cannot delete homepage' },
        { status: 400 }
      );
    }

    // Delete will cascade to homepage_sections due to foreign key
    await productsPool.query(
      'DELETE FROM pages WHERE id = ?',
      [id]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Page deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
