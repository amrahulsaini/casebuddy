/**
 * API Route: /casetool/api/bulk-list?case_type=transparent
 * Returns saved bulk generation rows so the page can restore after reload.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const caseType = request.nextUrl.searchParams.get('case_type') || 'transparent';
  try {
    const [rows]: any = await pool.execute(
      `SELECT id, file_name, model_name, case_type, src_url, src_thumb, gen_url, file_base, prompt, mark, status
         FROM bulk_generations
        WHERE case_type = ?
        ORDER BY id ASC`,
      [caseType]
    );
    return NextResponse.json({ success: true, rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, rows: [], error: e?.message || 'list failed' });
  }
}
