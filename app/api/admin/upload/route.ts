import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    console.log('=== Upload API called ===');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'product';

    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      uploadType: type
    });

    if (!file) {
      console.error('No file in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: `Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed. Received: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, extension);
    const filename = `${type}_${timestamp}_${randomString}_${nameWithoutExt}${extension}`;

    // Determine upload directory based on type
    const uploadSubDir = type === 'category' ? 'categories' : 'products';
    
    // Always save to the Next.js public/cdn folder (this works in both dev and production)
    const uploadDir = path.join(process.cwd(), 'public', 'cdn', uploadSubDir);
    const filepath = path.join(uploadDir, filename);
    const url = `/cdn/${uploadSubDir}/${filename}`;

    console.log('Upload configuration:', {
      cwd: process.cwd(),
      uploadDir,
      filepath,
      url,
      exists: existsSync(uploadDir)
    });

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('Upload directory ready:', uploadDir);
    } catch (dirError) {
      console.error('Failed to create directory:', dirError);
      return NextResponse.json(
        { error: `Failed to create upload directory: ${dirError instanceof Error ? dirError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Convert file to buffer and save
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log('Writing file:', {
        path: filepath,
        size: buffer.length
      });
      
      await writeFile(filepath, buffer);
      console.log('File written successfully');
    } catch (writeError) {
      console.error('File write error:', writeError);
      return NextResponse.json(
        { error: `Failed to write file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Verify file was saved
    if (!existsSync(filepath)) {
      console.error('File verification failed - file does not exist after write');
      return NextResponse.json(
        { error: 'File was not saved to disk - check permissions and path' },
        { status: 500 }
      );
    }

    // Generate absolute URL with proper domain detection
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;
    const absoluteUrl = `${origin}${url}`;

    console.log('Upload successful:', {
      url,
      absoluteUrl,
      filename,
      origin,
      host,
      protocol
    });

    return NextResponse.json({
      success: true,
      url,
      absoluteUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
