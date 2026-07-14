import type { Pool } from 'mysql2/promise';

let ensured: Promise<void> | null = null;

export function ensureRefundColumns(pool: Pool): Promise<void> {
  if (ensured) return ensured;
  ensured = (async () => {
    const adds = [
      "ADD COLUMN razorpay_payment_id VARCHAR(255) DEFAULT NULL",
      "ADD COLUMN razorpay_refund_id VARCHAR(255) DEFAULT NULL",
    ];
    for (const a of adds) {
      try { await pool.query(`ALTER TABLE orders ${a}`); }
      catch { /* column already exists */ }
    }
  })().catch(err => {
    ensured = null;
    throw err;
  });
  return ensured;
}
