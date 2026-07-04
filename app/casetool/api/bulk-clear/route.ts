/**
 * API Route: /casetool/api/bulk-clear
 * Deletes all saved bulk rows for a category (used by the Clear All button).
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const caseType = (form.get('case_type') as string) || 'transparent';
    await ensureBulkTable(pool);
    await pool.execute(`DELETE FROM bulk_generations WHERE case_type = ?`, [caseType]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'clear failed' }, { status: 500 });
  }
}
