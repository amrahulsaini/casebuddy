/**
 * API Route: /casetool/api/bulk-mark
 * Persists a right/wrong/none mark for a generated bulk image.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const fileName = (form.get('file_name') as string) || '';
    const caseType = (form.get('case_type') as string) || 'transparent';
    const mark = (form.get('mark') as string) || 'none';
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'file_name required' }, { status: 400 });
    }
    if (!['none', 'right', 'wrong'].includes(mark)) {
      return NextResponse.json({ success: false, error: 'invalid mark' }, { status: 400 });
    }
    await ensureBulkTable(pool);
    await pool.execute(
      `UPDATE bulk_generations SET mark = ? WHERE file_name = ? AND case_type = ?`,
      [mark, fileName, caseType]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'mark failed' }, { status: 500 });
  }
}
