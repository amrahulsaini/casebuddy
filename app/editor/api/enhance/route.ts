import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log('Enhancement request received');
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      console.error('No image file provided');
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Image file received:', imageFile.name, imageFile.type, imageFile.size);
    
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    console.log('Buffer created, size:', buffer.length);
    
    // Use Sharp for high-quality 4K upscaling
    console.log('Processing 4K upscaling with Sharp...');
    
    const metadata = await sharp(buffer).metadata();
    console.log('Original image dimensions:', metadata.width, 'x', metadata.height);
    
    // Calculate target dimensions (2x upscale, capped at 4K)
    const targetWidth = Math.min((metadata.width || 1920) * 2, 3840);
    const targetHeight = Math.min((metadata.height || 1080) * 2, 2160);
    
    console.log('Target dimensions:', targetWidth, 'x', targetHeight);
    
    // Perform high-quality upscaling
    const finalEnhanced = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        kernel: 'lanczos3',
        fit: 'inside',
      })
      .sharpen({ sigma: 1.5, m1: 1.0, m2: 0.5 })
      .png({
        quality: 95,
        compressionLevel: 6,
      })
      .toBuffer();
    
    console.log('Enhanced image created, size:', finalEnhanced.length, 'bytes');
    
    // Save the enhanced image
    const ts = Date.now();
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);
    
    const outputDir = join(cwd, 'public', 'output');
    console.log('Output directory path:', outputDir);
    console.log('Output directory exists?', existsSync(outputDir));
    
    if (!existsSync(outputDir)) {
      console.log('Creating output directory:', outputDir);
      try {
        await mkdir(outputDir, { recursive: true });
        console.log('Directory created successfully');
      } catch (mkdirError: any) {
        console.error('Failed to create directory:', mkdirError);
        throw new Error(`Cannot create output directory: ${mkdirError.message}`);
      }
    }

    const fileName = `enhanced_${ts}.png`;
    const filePath = join(outputDir, fileName);
    console.log('Attempting to save file to:', filePath);
    
    try {
      await writeFile(filePath, finalEnhanced);
      console.log('Enhanced image saved successfully:', fileName);
    } catch (writeError: any) {
      console.error('Failed to write file:', writeError);
      throw new Error(`Cannot write file: ${writeError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: `/output/${fileName}`,
        message: 'Image enhanced successfully to 4K quality',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('=== ENHANCEMENT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);
    console.error('========================');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to enhance image',
        details: error.message,
        errorCode: error.code || 'UNKNOWN',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
