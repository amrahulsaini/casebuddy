/**
 * API Route: /casetool/api/bulk-download?range=today|week|month|all&day=YYYY-MM-DD
 *
 * Zips up every generated bulk image for the requested period and streams it
 * back. Each file inside the zip is named after the phone model it was
 * generated for, so the archive is usable without touching the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import JSZip from 'jszip';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BULK_DIR = join(process.cwd(), 'public', 'output', 'bulk');

/** Turns a model name into a safe file name stem. */
function safeName(model: string | null, fallback: string) {
  const base = (model || '').trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base || fallback;
}

/** Extracts the on-disk file name from gen_file or a gen_url. */
function diskName(genFile: string | null, genUrl: string | null): string | null {
  if (genFile && /^[A-Za-z0-9._-]+\.(png|jpe?g|webp|gif|bmp)$/i.test(genFile)) return genFile;
  if (genUrl) {
    const m = genUrl.match(/[?&]name=([^&]+)/);
    const candidate = m ? decodeURIComponent(m[1]) : genUrl.split('/').pop() || '';
    if (/^[A-Za-z0-9._-]+\.(png|jpe?g|webp|gif|bmp)$/i.test(candidate)) return candidate;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const range = (sp.get('range') || 'all').toLowerCase();
  const day = sp.get('day') || '';
  const caseType = sp.get('case_type') || '';

  const where: string[] = ["status = 'success'"];
  const args: any[] = [];

  if (caseType) { where.push('case_type = ?'); args.push(caseType); }

  let periodLabel = 'all-time';
  if (day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }
    where.push('DATE(created_at) = ?');
    args.push(day);
    periodLabel = day;
  } else if (range === 'today') {
    where.push('DATE(created_at) = CURDATE()');
    periodLabel = 'today';
  } else if (range === 'week') {
    where.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    periodLabel = 'last-7-days';
  } else if (range === 'month') {
    where.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
    periodLabel = 'last-30-days';
  }

  try {
    await ensureBulkTable(pool);

    const [rows]: any = await pool.query(
      `SELECT id, model_name, file_name, gen_file, gen_url, created_at
         FROM bulk_api_calls
        WHERE ${where.join(' AND ')}
        ORDER BY id ASC`,
      args
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No images found for this period' }, { status: 404 });
    }

    const zip = new JSZip();
    const used = new Map<string, number>();
    let added = 0;
    let missing = 0;

    for (const r of rows) {
      const name = diskName(r.gen_file, r.gen_url);
      if (!name) { missing++; continue; }
      const filePath = join(BULK_DIR, name);
      if (!existsSync(filePath)) { missing++; continue; }

      const ext = extname(name) || '.png';
      const stem = safeName(r.model_name, `image-${r.id}`);
      const count = (used.get(stem) || 0) + 1;
      used.set(stem, count);
      const entry = count === 1 ? `${stem}${ext}` : `${stem} (${count})${ext}`;

      zip.file(entry, await readFile(filePath));
      added++;
    }

    if (added === 0) {
      return NextResponse.json({ error: 'Images are no longer on disk' }, { status: 404 });
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    const zipName = `bulk-images-${periodLabel}-${added}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Content-Length': String(buffer.length),
        'X-Images-Added': String(added),
        'X-Images-Missing': String(missing),
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'download failed' }, { status: 500 });
  }
}
