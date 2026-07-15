/**
 * API Route: /casetool/api/bulk-billing?case_type=transparent
 * Totals what the bulk runs have cost, overall and per image model.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const caseType = request.nextUrl.searchParams.get('case_type') || 'transparent';
  try {
    await ensureBulkTable(pool);
    const [totals]: any = await pool.execute(
      `SELECT COUNT(*) AS images,
              COALESCE(SUM(cost_usd), 0) AS usd,
              COALESCE(SUM(cost_inr), 0) AS inr
         FROM bulk_generations
        WHERE case_type = ? AND status = 'done'`,
      [caseType]
    );
    const [byModel]: any = await pool.execute(
      `SELECT image_model AS model,
              COUNT(*) AS images,
              COALESCE(SUM(cost_inr), 0) AS inr
         FROM bulk_generations
        WHERE case_type = ? AND status = 'done'
        GROUP BY image_model`,
      [caseType]
    );
    const t = totals[0] || {};
    return NextResponse.json({
      success: true,
      images: Number(t.images) || 0,
      usd: Number(t.usd) || 0,
      inr: Number(t.inr) || 0,
      byModel: (byModel || []).map((r: any) => ({
        model: r.model || 'unknown',
        images: Number(r.images) || 0,
        inr: Number(r.inr) || 0,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'billing failed' });
  }
}
