/**
 * API Route: /casetool/api/bulk-upload
 * Saves uploaded reference images server-side and upserts pending rows so the
 * reference thumbnails persist across reloads without re-uploading the folder.
 * Accepts a chunk of files per request (the page uploads in batches).
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 300;

function sanitizeBase(name: string) {
  return name
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'src';
}

function extOf(name: string) {
  const m = name.match(/\.(png|jpe?g|webp|gif|bmp)$/i);
  return m ? m[0].toLowerCase() : '.jpg';
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const caseType = (form.get('case_type') as string) || 'transparent';
    const files = form.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files' }, { status: 400 });
    }

    const outputDir = join(process.cwd(), 'public', 'output', 'bulk');
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });

    const saved: { file_name: string; src_url: string }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base = sanitizeBase(file.name);
      const srcFile = `src_${base}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${extOf(file.name)}`;
      await writeFile(join(outputDir, srcFile), buffer);
      const srcUrl = `/casetool/api/bulk-file?name=${encodeURIComponent(srcFile)}`;
      const modelName = base.replace(/_/g, ' ').trim() || file.name;

      // Insert a pending row if new; only refresh the source if it changed,
      // never touch generated fields or the right/wrong mark.
      try {
        await pool.execute(
          `INSERT INTO bulk_generations (file_name, model_name, case_type, src_file, src_url, status)
           VALUES (?, ?, ?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE src_file = VALUES(src_file), src_url = VALUES(src_url)`,
          [file.name, modelName, caseType, srcFile, srcUrl]
        );
      } catch (e) {
        console.error('bulk-upload upsert failed:', e);
      }
      saved.push({ file_name: file.name, src_url: srcUrl });
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'upload failed' }, { status: 500 });
  }
}
