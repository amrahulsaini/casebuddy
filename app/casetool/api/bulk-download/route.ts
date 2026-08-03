/**
 * API Route: /casetool/api/bulk-download?range=today|week|month|all&day=YYYY-MM-DD
 *
 * Streams a zip of every generated bulk image for the requested period. Each
 * file inside the zip is named after the phone model it was generated for.
 *
 * The zip is streamed, never buffered: entries are read off disk lazily and
 * pushed to the client as they are packed, so the browser's download starts
 * within a second regardless of how many thousands of images are in the
 * archive, and the server never holds more than one file in memory.
 *
 * `?count=1` returns just the number of downloadable images, so the UI can
 * fail fast (and show a real error) before kicking off the native download.
 */

import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { Readable } from 'stream';
import { ZipArchive } from 'archiver';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 3600;

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

/**
 * Builds the WHERE clause for the request: either an explicit list of call ids
 * (a hand-picked selection) or a time period.
 */
function periodFilter(sp: URLSearchParams) {
  const range = (sp.get('range') || 'all').toLowerCase();
  const day = sp.get('day') || '';
  const caseType = sp.get('case_type') || '';
  const idsRaw = sp.get('ids') || '';

  const where: string[] = ["status = 'success'"];
  const args: any[] = [];
  let label = 'all-time';

  if (caseType) { where.push('case_type = ?'); args.push(caseType); }

  if (idsRaw) {
    const ids = idsRaw.split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n) && n > 0);
    if (ids.length === 0) return null;
    where.push(`id IN (${ids.map(() => '?').join(',')})`);
    args.push(...ids);
    return { where: where.join(' AND '), args, label: `selected-${ids.length}` };
  }

  if (day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    where.push('DATE(created_at) = ?');
    args.push(day);
    label = day;
  } else if (range === 'today') {
    where.push('DATE(created_at) = CURDATE()');
    label = 'today';
  } else if (range === 'week') {
    where.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    label = 'last-7-days';
  } else if (range === 'month') {
    where.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
    label = 'last-30-days';
  }

  return { where: where.join(' AND '), args, label };
}

async function handle(sp: URLSearchParams) {
  const filter = periodFilter(sp);
  if (!filter) return NextResponse.json({ error: 'Invalid selection' }, { status: 400 });

  try {
    await ensureBulkTable(pool);

    const [rows]: any = await pool.query(
      `SELECT id, model_name, gen_file, gen_url
         FROM bulk_api_calls
        WHERE ${filter.where}
        ORDER BY id ASC`,
      filter.args
    );

    // Resolve every row to a file that actually exists before promising a zip —
    // once bytes start streaming there is no way to report an error.
    const used = new Map<string, number>();
    const entries: { path: string; entry: string }[] = [];

    for (const r of rows || []) {
      const name = diskName(r.gen_file, r.gen_url);
      if (!name) continue;
      const path = join(BULK_DIR, name);
      if (!existsSync(path)) continue;

      const stem = safeName(r.model_name, `image-${r.id}`);
      const count = (used.get(stem) || 0) + 1;
      used.set(stem, count);
      const ext = extname(name) || '.png';
      entries.push({ path, entry: count === 1 ? `${stem}${ext}` : `${stem} (${count})${ext}` });
    }

    // Cheap pre-flight so the UI can show a real error instead of a broken file.
    if (sp.get('count')) {
      return NextResponse.json({ success: true, count: entries.length, label: filter.label });
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No images found on disk for this period' }, { status: 404 });
    }

    // archiver writes a standard, Explorer-readable archive: it seeks back to
    // patch each entry header rather than emitting data descriptors, and it
    // handles the Zip64 extensions an archive over 4 GB needs.
    // store: PNG/JPEG are already compressed, so deflating only burns CPU.
    const archive = new ZipArchive({ store: true, zip64: true });
    for (const e of entries) archive.file(e.path, { name: e.entry });

    // A vanished file should not kill the whole archive.
    archive.on('warning', (err: any) => {
      if (err?.code !== 'ENOENT') console.error('bulk-download warning:', err);
    });

    // Readable.toWeb keeps backpressure intact, so a slow client throttles the
    // disk reads instead of the server buffering the archive in memory.
    const body = Readable.toWeb(archive as unknown as Readable) as ReadableStream<Uint8Array>;
    archive.finalize();

    const zipName = `bulk-images-${filter.label}-${entries.length}.zip`;

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Cache-Control': 'no-store',
        // Stops nginx from buffering the whole archive before sending a byte.
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'download failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request.nextUrl.searchParams);
}

/**
 * Same as GET, but takes its parameters as a form body. A hand-picked
 * selection of a few hundred images would otherwise blow past URL length
 * limits, so the page submits those as a POST form.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const sp = new URLSearchParams();
  for (const [k, v] of form.entries()) if (typeof v === 'string') sp.append(k, v);
  return handle(sp);
}
