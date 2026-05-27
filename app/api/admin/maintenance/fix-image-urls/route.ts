import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { productsPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// One-shot cleanup for product_images.image_url rows that got saved with a
// "https, https://..." prefix (caused by chained x-forwarded-proto headers
// before commit bafb2ba fixed the upload route). Admin-only. Safe to re-run.
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await productsPool.getConnection();
  try {
    const [broken] = await connection.execute<RowDataPacket[]>(
      "SELECT id, product_id, image_url FROM product_images WHERE image_url LIKE 'http%, http%'"
    );

    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE product_images
         SET image_url = TRIM(SUBSTRING(image_url, LOCATE(', ', image_url) + 2))
       WHERE image_url LIKE 'http%, http%'`
    );

    return NextResponse.json({
      success: true,
      affected: result.affectedRows,
      sample: broken.slice(0, 10),
    });
  } catch (error) {
    console.error('fix-image-urls error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
