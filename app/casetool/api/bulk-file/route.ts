/**
 * API Route: /casetool/api/bulk-file?name=<file.png>
 * Serves generated bulk images from public/output/bulk. Reading them through
 * an API route (instead of relying on static serving of runtime-written
 * public files) guarantees previews work in both dev and production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  // Only allow a bare image filename — block any path traversal.
  const m = name.match(/^[A-Za-z0-9._-]+\.(png|jpe?g|webp|gif|bmp)$/i);
  if (!m) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }
  const filePath = join(process.cwd(), 'public', 'output', 'bulk', name);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const buffer = await readFile(filePath);
  const ext = m[1].toLowerCase();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
