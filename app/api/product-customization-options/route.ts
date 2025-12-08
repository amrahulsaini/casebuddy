import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// GET - Fetch customization options for a product
export async function GET(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Get all customization options for this product with their types
    const [rows] = await connection.execute(`
      SELECT 
        pco.id,
        pco.product_id,
        pco.customization_type_id,
        pco.is_required,
        pco.sort_order,
        ct.type_name,
        ct.display_name,
        ct.input_type
      FROM product_customization_options pco
      JOIN customization_types ct ON pco.customization_type_id = ct.id
      WHERE pco.product_id = ?
      ORDER BY pco.sort_order, ct.display_name
    `, [productId]) as any;

    return NextResponse.json({ options: rows });
  } catch (error) {
    console.error('Error fetching product customization options:', error);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST - Add customization option to a product
export async function POST(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const body = await request.json();
    const { product_id, customization_type_id, is_required = 0, sort_order = 0 } = body;

    if (!product_id || !customization_type_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await connection.execute(
      'INSERT INTO product_customization_options (product_id, customization_type_id, is_required, sort_order) VALUES (?, ?, ?, ?)',
      [product_id, customization_type_id, is_required, sort_order]
    ) as any;

    return NextResponse.json({ 
      message: 'Customization option added successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding customization option:', error);
    return NextResponse.json({ error: 'Failed to add option' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE - Remove customization option from product
export async function DELETE(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await connection.execute('DELETE FROM product_customization_options WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Customization option removed successfully' });
  } catch (error) {
    console.error('Error removing customization option:', error);
    return NextResponse.json({ error: 'Failed to remove option' }, { status: 500 });
  } finally {
    connection.release();
  }
}
