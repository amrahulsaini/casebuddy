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
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();
    
    console.log('Enhanced image created, size:', finalEnhanced.length, 'bytes');
    
    // Save the enhanced image
    const ts = Date.now();
    const outputDir = join(process.cwd(), 'public', 'output');
    
    if (!existsSync(outputDir)) {
      console.log('Creating output directory:', outputDir);
      await mkdir(outputDir, { recursive: true });
    }

    const fileName = `enhanced_${ts}.jpg`;
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, finalEnhanced);
    
    console.log('Enhanced image saved:', fileName);

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
    console.error('Enhancement error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: 'Failed to enhance image',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
