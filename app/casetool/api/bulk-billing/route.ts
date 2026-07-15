/**
 * API Route: /casetool/api/bulk-billing?case_type=transparent
 * Real billing: totals every image API call ever made (retries included),
 * from the bulk_api_calls log.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const caseType = request.nextUrl.searchParams.get('case_type') || '';
  const where = caseType ? 'WHERE case_type = ?' : '';
  const args = caseType ? [caseType] : [];

  try {
    await ensureBulkTable(pool);

    const [totals]: any = await pool.query(
      `SELECT COUNT(*) AS calls,
              COALESCE(SUM(cost_inr), 0) AS inr,
              SUM(status = 'success') AS ok,
              SUM(status <> 'success') AS failed
         FROM bulk_api_calls ${where}`,
      args
    );

    const [byModel]: any = await pool.query(
      `SELECT image_model, model_label, model_key,
              COUNT(*) AS calls,
              COALESCE(SUM(cost_inr), 0) AS inr
         FROM bulk_api_calls ${where}
        GROUP BY image_model, model_label, model_key
        ORDER BY inr DESC`,
      args
    );

    const [today]: any = await pool.query(
      `SELECT COUNT(*) AS calls, COALESCE(SUM(cost_inr), 0) AS inr
         FROM bulk_api_calls
        ${caseType ? 'WHERE case_type = ? AND' : 'WHERE'} DATE(created_at) = CURDATE()`,
      args
    );

    const [daily]: any = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS calls, COALESCE(SUM(cost_inr), 0) AS inr
         FROM bulk_api_calls ${where}
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30`,
      args
    );

    // Every call, newest first — no limit.
    const [recent]: any = await pool.query(
      `SELECT id, case_type, file_name, model_name, model_label, image_model,
              cost_inr, status, created_at, gen_url
         FROM bulk_api_calls ${where}
        ORDER BY id DESC`,
      args
    );

    // How many times each phone model was generated, and what it cost.
    const [byPhone]: any = await pool.query(
      `SELECT c.file_name, c.case_type,
              MAX(c.model_name) AS model_name,
              COUNT(*) AS attempts,
              SUM(c.status = 'success') AS ok,
              COALESCE(SUM(c.cost_inr), 0) AS inr,
              MAX(c.id) AS last_id,
              SUBSTRING_INDEX(GROUP_CONCAT(c.gen_url ORDER BY c.id DESC SEPARATOR '||'), '||', 1) AS latest_gen
         FROM bulk_api_calls c ${where}
        GROUP BY c.file_name, c.case_type
        ORDER BY attempts DESC, inr DESC`,
      args
    );

    const t = totals[0] || {};
    return NextResponse.json({
      success: true,
      calls: Number(t.calls) || 0,
      inr: Number(t.inr) || 0,
      ok: Number(t.ok) || 0,
      failed: Number(t.failed) || 0,
      today: { calls: Number(today[0]?.calls) || 0, inr: Number(today[0]?.inr) || 0 },
      byModel: (byModel || []).map((r: any) => ({
        imageModel: r.image_model || 'unknown',
        label: r.model_label || r.image_model || 'unknown',
        modelKey: r.model_key,
        calls: Number(r.calls) || 0,
        inr: Number(r.inr) || 0,
      })),
      daily: (daily || []).map((r: any) => ({
        day: r.day, calls: Number(r.calls) || 0, inr: Number(r.inr) || 0,
      })),
      recent: (recent || []).map((r: any) => ({
        id: r.id,
        caseType: r.case_type,
        fileName: r.file_name,
        modelName: r.model_name,
        label: r.model_label || r.image_model,
        costInr: Number(r.cost_inr) || 0,
        status: r.status,
        createdAt: r.created_at,
        genUrl: r.gen_url || null,
      })),
      byPhone: (byPhone || []).map((r: any) => ({
        fileName: r.file_name,
        caseType: r.case_type,
        modelName: r.model_name,
        attempts: Number(r.attempts) || 0,
        ok: Number(r.ok) || 0,
        inr: Number(r.inr) || 0,
        latestGen: r.latest_gen || null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'billing failed' });
  }
}
