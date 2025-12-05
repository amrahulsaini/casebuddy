import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  try {
    const { id } = await params;

    const [images] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
      [id]
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// POST - Add new image to product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  try {
    const { id } = await params;
    const body = await request.json();
    const { image_url, alt_text, is_primary } = body;

    await connection.beginTransaction();

    // If this is set as primary, unset all other primary images
    if (is_primary) {
      await connection.execute(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [id]
      );
    }

    // Get the next sort order
    const [maxSort] = await connection.execute<RowDataPacket[]>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM product_images WHERE product_id = ?',
      [id]
    );
    const sortOrder = maxSort[0]?.next_order || 0;

    // Insert new image
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
      [id, image_url, alt_text || '', sortOrder, is_primary || false]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      imageId: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding product image:', error);
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// PUT - Update images (reorder or set primary)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, imageId, images } = body;

    await connection.beginTransaction();

    if (action === 'reorder' && images) {
      // Update sort order for multiple images
      for (let i = 0; i < images.length; i++) {
        await connection.execute(
          'UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?',
          [i, images[i].id, id]
        );
      }
    } else if (action === 'set_primary' && imageId) {
      // Unset all primary images first
      await connection.execute(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [id]
      );
      // Set new primary image
      await connection.execute(
        'UPDATE product_images SET is_primary = TRUE WHERE id = ? AND product_id = ?',
        [imageId, id]
      );
    }

    await connection.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating product images:', error);
    return NextResponse.json(
      { error: 'Failed to update images' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      );
    }

    await connection.execute(
      'DELETE FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
