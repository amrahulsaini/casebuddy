import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// PUT - Update design
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { design_name, design_image_url, sort_order, is_active } = body;

    const updates = [];
    const values = [];

    if (design_name !== undefined) {
      updates.push('design_name = ?');
      values.push(design_name);
    }
    if (design_image_url !== undefined) {
      updates.push('design_image_url = ?');
      values.push(design_image_url);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    await connection.execute(
      `UPDATE product_designs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: 'Design updated successfully' });
  } catch (error) {
    console.error('Error updating product design:', error);
    return NextResponse.json({ error: 'Failed to update product design' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  
  try {
    const { id } = await params;

    await connection.execute('DELETE FROM product_designs WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting product design:', error);
    return NextResponse.json({ error: 'Failed to delete product design' }, { status: 500 });
  } finally {
    connection.release();
  }
}
