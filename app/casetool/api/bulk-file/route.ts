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

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  // Only allow a bare filename ending in .png — block any path traversal.
  if (!/^[A-Za-z0-9._-]+\.png$/.test(name)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }
  const filePath = join(process.cwd(), 'public', 'output', 'bulk', name);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
