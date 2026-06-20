/**
 * API Route: /casetool/api/bulk-upload
 * Saves uploaded reference images server-side and upserts pending rows so the
 * reference thumbnails persist across reloads without re-uploading the folder.
 * Accepts a chunk of files per request (the page uploads in batches).
 */

import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const caseType = (form.get('case_type') as string) || 'transparent';
    const files = form.getAll('files') as File[];
    const origNames = form.getAll('orig_names') as string[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files' }, { status: 400 });
    }

    const saved: { file_name: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const origName = origNames[i] || file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const base = sanitizeBase(origName);
      const modelName = base.replace(/_/g, ' ').trim() || origName;

      // Store the reference thumbnail inline in the DB as a base64 data URL so
      // it can never 404 (no disk dependency, survives redeploys).
      const mime = (file.type && file.type.includes('jpeg')) ? 'image/jpeg' : 'image/jpeg';
      const srcThumb = `data:${mime};base64,${buffer.toString('base64')}`;

      // Insert a pending row if new; only refresh the source thumbnail,
      // never touch generated fields or the right/wrong mark.
      try {
        await pool.execute(
          `INSERT INTO bulk_generations (file_name, model_name, case_type, src_thumb, status)
           VALUES (?, ?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE src_thumb = VALUES(src_thumb)`,
          [origName, modelName, caseType, srcThumb]
        );
      } catch (e) {
        console.error('bulk-upload upsert failed:', e);
      }
      saved.push({ file_name: origName });
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'upload failed' }, { status: 500 });
  }
}
