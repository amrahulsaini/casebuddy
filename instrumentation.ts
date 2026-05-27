// Next.js calls register() once when the server boots.
// We use it to repair product_images.image_url rows that were saved with a
// "https, https://..." prefix before the upload route was fixed (commit
// bafb2ba). Runs once per server start; safe and idempotent.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { productsPool } = await import('./lib/db');
    const connection = await productsPool.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE product_images
           SET image_url = TRIM(SUBSTRING(image_url, LOCATE(', ', image_url) + 2))
         WHERE image_url LIKE 'http%, http%'`
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (affected > 0) {
        console.log(`[startup] Repaired ${affected} product_images row(s) with broken prefix`);
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[startup] image_url repair failed:', error);
  }
}
