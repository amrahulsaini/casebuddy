import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// GET - Fetch customization values
export async function GET(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const customizationTypeId = searchParams.get('customization_type_id');
    const productId = searchParams.get('product_id');

    let query = `
      SELECT 
        cv.*,
        ct.type_name,
        ct.display_name,
        ct.input_type
      FROM customization_values cv
      JOIN customization_types ct ON cv.customization_type_id = ct.id
      WHERE cv.is_active = 1
    `;
    const params = [];

    if (customizationTypeId) {
      query += ' AND cv.customization_type_id = ?';
      params.push(customizationTypeId);
    }

    if (productId) {
      query += ' AND (cv.product_id = ? OR cv.product_id IS NULL)';
      params.push(productId);
    }

    query += ' ORDER BY cv.sort_order, cv.value_name';

    const [rows] = await connection.execute(query, params);

    return NextResponse.json({ values: rows });
  } catch (error) {
    console.error('Error fetching customization values:', error);
    return NextResponse.json({ error: 'Failed to fetch values' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST - Create customization value
export async function POST(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const body = await request.json();
    const { 
      customization_type_id, 
      product_id = null, 
      value_name, 
      value_data, 
      price_modifier = 0, 
      sort_order = 0,
      is_active = 1 
    } = body;

    if (!customization_type_id || !value_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await connection.execute(
      `INSERT INTO customization_values 
       (customization_type_id, product_id, value_name, value_data, price_modifier, sort_order, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customization_type_id, product_id, value_name, value_data, price_modifier, sort_order, is_active]
    );

    return NextResponse.json({ 
      message: 'Customization value created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating customization value:', error);
    return NextResponse.json({ error: 'Failed to create value' }, { status: 500 });
  } finally {
    connection.release();
  }
}
