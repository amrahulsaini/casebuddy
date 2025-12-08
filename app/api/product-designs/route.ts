import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// GET all designs for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  const connection = await productsPool.getConnection();
  
  try {
    const [designs] = await connection.execute(
      'SELECT * FROM product_designs WHERE product_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
      [productId]
    );

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching product designs:', error);
    return NextResponse.json({ error: 'Failed to fetch product designs' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST - Create new design
export async function POST(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const body = await request.json();
    const { product_id, design_name, design_image_url, sort_order } = body;

    if (!product_id || !design_name || !design_image_url) {
      return NextResponse.json(
        { error: 'Product ID, design name, and image URL are required' },
        { status: 400 }
      );
    }

    const [result] = await connection.execute(
      'INSERT INTO product_designs (product_id, design_name, design_image_url, sort_order) VALUES (?, ?, ?, ?)',
      [product_id, design_name, design_image_url, sort_order || 0]
    );

    return NextResponse.json({
      message: 'Design added successfully',
      id: (result as any).insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product design:', error);
    return NextResponse.json({ error: 'Failed to create product design' }, { status: 500 });
  } finally {
    connection.release();
  }
}
