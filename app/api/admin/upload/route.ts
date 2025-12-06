import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CATEGORY_UPLOAD_DIR = path.join(process.cwd(), 'public', 'cdn', 'categories');
const PRODUCT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'cdn', 'products');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'product';

    console.log('File received:', file?.name, 'Type:', type);

    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const filename = `${type}_${timestamp}_${nameWithoutExt}${extension}`;

    let uploadDir = PRODUCT_UPLOAD_DIR;
    // Compute base path -- take NEXT_PUBLIC_BASE_PATH if set, otherwise derive from NEXT_PUBLIC_BASE_URL
    const rawBase = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL).pathname : '');
    let basePath = rawBase || '';
    basePath = basePath.replace(/\/$/, ''); // remove trailing slash if any
    if (basePath && !basePath.startsWith('/')) basePath = '/' + basePath;

    let url = `${basePath}/cdn/products/${filename}`;
    if (type === 'category') {
      uploadDir = CATEGORY_UPLOAD_DIR;
      url = `${basePath}/cdn/categories/${filename}`;
    }

    console.log('Upload dir:', uploadDir);
    console.log('URL:', url);

    // Create upload directory if it doesn't exist
    try {
      if (!existsSync(uploadDir)) {
        console.log('Creating upload directory:', uploadDir);
        await mkdir(uploadDir, { recursive: true });
        console.log('Directory created successfully');
      } else {
        console.log('Upload directory already exists');
      }
    } catch (dirError) {
      console.error('Directory creation error:', dirError);
      return NextResponse.json(
        { error: `Failed to create upload directory: ${dirError instanceof Error ? dirError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);

    console.log('Saving file to:', filepath);
    console.log('File size:', buffer.length);

    try {
      await writeFile(filepath, buffer);
      console.log('File write completed');
    } catch (writeError) {
      console.error('File write error:', writeError);
      return NextResponse.json(
        { error: `Failed to write file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Verify file was saved
    const fileExists = existsSync(filepath);
    console.log('File exists after save:', fileExists);

    if (!fileExists) {
      return NextResponse.json(
        { error: 'File was not saved to disk - check permissions and path' },
        { status: 500 }
      );
    }

    console.log('Upload successful, returning URL:', url);

    // Resolve origin from the request (supports proxies setting x-forwarded-* headers)
    let origin = '';
    try {
      // NextRequest has nextUrl which contains an origin
      origin = request.nextUrl?.origin || '';
    } catch (err) {
      origin = '';
    }

    // Fall back to x-forwarded or host
    if (!origin) {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      origin = host ? `${proto}://${host}` : '';
    }

    const absoluteUrl = origin ? `${origin}${url}` : url;

    // Return both relative (url) and absolute URL (absoluteUrl)
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
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
