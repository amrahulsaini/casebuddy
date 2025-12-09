import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM hero_banners ORDER BY sort_order ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, description, cta_text, cta_link, gradient, sort_order } = body;

    const [result]: any = await pool.execute(
      `INSERT INTO hero_banners (title, subtitle, description, cta_text, cta_link, gradient, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle, description, cta_text, cta_link, gradient, sort_order || 0]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, subtitle, description, cta_text, cta_link, gradient, sort_order, is_active } = body;

    await pool.execute(
      `UPDATE hero_banners 
       SET title = ?, subtitle = ?, description = ?, cta_text = ?, cta_link = ?, 
           gradient = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [title, subtitle, description, cta_text, cta_link, gradient, sort_order, is_active, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID required' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM hero_banners WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
