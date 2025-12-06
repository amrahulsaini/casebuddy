import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

    try {
      const [brands] = await connection.execute(
        'SELECT * FROM phone_brands WHERE id = ?',
        [id]
      );

      if ((brands as any[]).length === 0) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }

      return NextResponse.json((brands as any[])[0]);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const connection = await productsPool.getConnection();

    try {
      await connection.execute(
        `UPDATE phone_brands 
         SET name = ?, slug = ?, logo_url = ?, sort_order = ?, is_active = ?
         WHERE id = ?`,
        [
          data.name,
          data.slug,
          data.logo_url || null,
          data.sort_order || 0,
          data.is_active ?? true,
          id,
        ]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const connection = await productsPool.getConnection();

    try {
      await connection.execute('DELETE FROM phone_brands WHERE id = ?', [id]);

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
