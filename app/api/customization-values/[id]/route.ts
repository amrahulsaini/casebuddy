import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// PUT - Update customization value
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { value_name, value_data, price_modifier, sort_order, is_active } = body;

    const updates = [];
    const values = [];

    if (value_name !== undefined) {
      updates.push('value_name = ?');
      values.push(value_name);
    }
    if (value_data !== undefined) {
      updates.push('value_data = ?');
      values.push(value_data);
    }
    if (price_modifier !== undefined) {
      updates.push('price_modifier = ?');
      values.push(price_modifier);
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
      `UPDATE customization_values SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: 'Value updated successfully' });
  } catch (error) {
    console.error('Error updating customization value:', error);
    return NextResponse.json({ error: 'Failed to update value' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE - Delete customization value
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await productsPool.getConnection();
  
  try {
    const { id } = await params;

    await connection.execute('DELETE FROM customization_values WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Value deleted successfully' });
  } catch (error) {
    console.error('Error deleting customization value:', error);
    return NextResponse.json({ error: 'Failed to delete value' }, { status: 500 });
  } finally {
    connection.release();
  }
}
