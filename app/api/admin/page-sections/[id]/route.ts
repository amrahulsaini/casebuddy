import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PUT: Update homepage section
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
    const { title, subtitle, sort_order, is_active } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Check if section exists
    const [existing]: any = await productsPool.query(
      'SELECT id FROM page_sections WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Update section (section_key cannot be changed)
    await productsPool.query(
      `UPDATE page_sections 
       SET title = ?, subtitle = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        title,
        subtitle || null,
        sort_order || 0,
        is_active !== false ? 1 : 0,
        id
      ]
    );

    // Fetch and return the updated section
    const [updated]: any = await productsPool.query(
      'SELECT * FROM page_sections WHERE id = ?',
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating page section:', error);
    return NextResponse.json(
      { error: 'Failed to update page section' },
      { status: 500 }
    );
  }
}

// DELETE: Delete homepage section
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

    // Check if section exists and get its section_key
    const [section]: any = await productsPool.query(
      'SELECT section_key FROM page_sections WHERE id = ?',
      [id]
    );

    if (section.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const connection = await productsPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Unlink categories from this section
      await connection.query(
        'UPDATE categories SET section_key = NULL WHERE section_key = ?',
        [section[0].section_key]
      );

      // Delete the section
      await connection.query(
        'DELETE FROM page_sections WHERE id = ?',
        [id]
      );

      await connection.commit();

      return NextResponse.json({ 
        success: true,
        message: 'Section deleted successfully' 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting page section:', error);
    return NextResponse.json(
      { error: 'Failed to delete page section' },
      { status: 500 }
    );
  }
}
