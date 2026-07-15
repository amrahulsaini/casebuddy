/**
 * API Route: /casetool/api/bulk-thumb?name=<file_name>&case_type=transparent
 * Serves the stored reference thumbnail (base64 in the DB) as a real image so
 * pages can lazy-load them via <img> instead of inlining megabytes of JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  const caseType = request.nextUrl.searchParams.get('case_type') || 'transparent';
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  try {
    await ensureBulkTable(pool);
    const [rows]: any = await pool.execute(
      `SELECT src_thumb FROM bulk_generations WHERE file_name = ? AND case_type = ? LIMIT 1`,
      [name, caseType]
    );
    const thumb: string | null = rows?.[0]?.src_thumb || null;
    if (!thumb || !thumb.startsWith('data:')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const comma = thumb.indexOf(',');
    const meta = thumb.slice(5, comma);            // e.g. "image/jpeg;base64"
    const mime = meta.split(';')[0] || 'image/jpeg';
    const buffer = Buffer.from(thumb.slice(comma + 1), 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'thumb failed' }, { status: 500 });
  }
}
