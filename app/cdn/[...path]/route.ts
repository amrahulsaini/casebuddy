import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = pathSegments.join('/');
    // Use direct path, avoid broad patterns
    const fullPath = path.resolve(process.cwd(), 'public', 'cdn', filePath);

    console.log('CDN file requested:', {
      requestedPath: filePath,
      fullPath,
      exists: existsSync(fullPath)
    });

    if (!existsSync(fullPath)) {
      console.error('File not found:', fullPath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving CDN file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
