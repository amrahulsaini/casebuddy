import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdRaw = cookieStore.get('casetool_user_id')?.value;
    const userId = userIdRaw ? parseInt(userIdRaw, 10) : null;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const logId = body?.logId ? Number(body.logId) : null;
    const sliceKeyRaw = body?.sliceKey ? String(body.sliceKey) : 'full';
    const sliceKey = sliceKeyRaw.trim() ? sliceKeyRaw.trim().slice(0, 64) : 'full';
    const downloadedUrl = body?.downloadedUrl ? String(body.downloadedUrl).slice(0, 500) : null;
    const downloadedLabel = body?.downloadedLabel ? String(body.downloadedLabel).slice(0, 100) : null;

    if (!logId || !Number.isFinite(logId)) {
      return NextResponse.json({ success: false, error: 'Missing logId' }, { status: 400 });
    }

    // Ensure user owns this generation
    const [genRows]: any = await pool.execute(
      'SELECT id FROM generation_logs WHERE id = ? AND user_id = ? LIMIT 1',
      [logId, userId]
    );

    if (!Array.isArray(genRows) || genRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Generation not found' }, { status: 404 });
    }

    // Ensure tables exist
    const [tableCheck]: any = await pool.execute(`SHOW TABLES LIKE 'download_billing_logs'`);
    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Billing tables not created',
          message: 'Please run database/add-download-billing.sql',
        },
        { status: 500 }
      );
    }

    // Idempotency: if already billed for this slice, do nothing.
    // Backward-compatible fallback for older schemas without slice_key.
    try {
      const [existing]: any = await pool.execute(
        'SELECT id, amount_inr, created_at FROM download_billing_logs WHERE generation_log_id = ? AND slice_key = ? LIMIT 1',
        [logId, sliceKey]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({
          success: true,
          alreadyBilled: true,
          amount_inr: Number(existing[0].amount_inr) || 0,
          billed_at: existing[0].created_at,
        });
      }
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (!msg.includes('unknown column') && !msg.includes('slice_key')) {
        throw e;
      }

      const [existingLegacy]: any = await pool.execute(
        'SELECT id, amount_inr, created_at FROM download_billing_logs WHERE generation_log_id = ? LIMIT 1',
        [logId]
      );
      if (Array.isArray(existingLegacy) && existingLegacy.length > 0) {
        return NextResponse.json({
          success: true,
          alreadyBilled: true,
          amount_inr: Number(existingLegacy[0].amount_inr) || 0,
          billed_at: existingLegacy[0].created_at,
        });
      }
    }

    // Compute amount from recorded API usage for this generation (fallback to 0 if not available)
    let amountINR = 0;
    try {
      const [usageRows]: any = await pool.execute(
        'SELECT COALESCE(SUM(cost_inr), 0) as total_inr FROM api_usage_logs WHERE user_id = ? AND generation_log_id = ?',
        [userId, logId]
      );
      amountINR = Number(usageRows?.[0]?.total_inr) || 0;
    } catch {
      // api_usage_logs might not exist in some deployments; keep amount as 0
      amountINR = 0;
    }

    // Insert billing row for this slice.
    // NOTE: amountINR is intentionally "same rupees" as generation cost (existing behavior), now charged per slice.
    try {
      await pool.execute(
        'INSERT INTO download_billing_logs (user_id, generation_log_id, slice_key, downloaded_url, downloaded_label, amount_inr) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, logId, sliceKey, downloadedUrl, downloadedLabel, amountINR]
      );
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      // If table isn't migrated yet, fall back to legacy insert.
      if (msg.includes('unknown column') && (msg.includes('slice_key') || msg.includes('downloaded_url') || msg.includes('downloaded_label'))) {
        await pool.execute(
          'INSERT INTO download_billing_logs (user_id, generation_log_id, amount_inr) VALUES (?, ?, ?)',
          [userId, logId, amountINR]
        );
      } else {
        throw e;
      }
    }

    return NextResponse.json({ success: true, alreadyBilled: false, amount_inr: amountINR });
  } catch (error: any) {
    // Duplicate insert (race) -> treat as already billed
    const msg = String(error?.message || '');
    if (msg.toLowerCase().includes('duplicate')) {
      return NextResponse.json({ success: true, alreadyBilled: true });
    }
    console.error('Billing download record error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record download billing', details: error.message },
      { status: 500 }
    );
  }
}
