import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

// GET - Fetch all customization types or by ID
export async function GET(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [rows] = await connection.execute(
        'SELECT * FROM customization_types WHERE id = ?',
        [id]
      ) as any;
      return NextResponse.json({ type: rows[0] || null });
    }

    const [rows] = await connection.execute(
      'SELECT * FROM customization_types WHERE is_active = 1 ORDER BY type_name'
    ) as any;
    return NextResponse.json({ types: rows });
  } catch (error) {
    console.error('Error fetching customization types:', error);
    return NextResponse.json({ error: 'Failed to fetch customization types' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST - Create new customization type
export async function POST(request: NextRequest) {
  const connection = await productsPool.getConnection();
  
  try {
    const body = await request.json();
    const { type_name, display_name, input_type, is_active = 1 } = body;

    if (!type_name || !display_name || !input_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await connection.execute(
      'INSERT INTO customization_types (type_name, display_name, input_type, is_active) VALUES (?, ?, ?, ?)',
      [type_name, display_name, input_type, is_active]
    ) as any;

    return NextResponse.json({ 
      message: 'Customization type created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating customization type:', error);
    return NextResponse.json({ error: 'Failed to create customization type' }, { status: 500 });
  } finally {
    connection.release();
  }
}
