import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IMAGE_ENHANCE_MODEL = process.env.IMAGE_ENHANCE_MODEL || 'gemini-3-pro-image-preview';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const imgB64 = buffer.toString('base64');
    
    console.log('Sending image to AI for quality enhancement...');
    
    // Send to Gemini AI - just the image with enhancement request
    const enhancementPrompt = `You are a professional image quality enhancement AI specialist. Your task is to upscale this image to 4K resolution (3840x2160 or proportional) with maximum quality preservation.

CRITICAL INSTRUCTIONS:
- PRESERVE: All colors, contrast, brightness, saturation EXACTLY as they are
- PRESERVE: All objects, people, elements in their EXACT positions
- PRESERVE: Original composition, framing, and perspective
- PRESERVE: Original artistic style and mood
- DO NOT: Add new elements, remove elements, or alter the scene
- DO NOT: Apply filters, effects, or artistic modifications
- DO NOT: Change lighting, shadows, or color grading
- ONLY: Increase resolution and enhance sharpness/clarity
- GOAL: Output a pixel-perfect upscaled version at 4K quality

Generate the enhanced 4K version now.`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageFile.type || 'image/jpeg',
                data: imgB64,
              },
            },
            { 
              text: enhancementPrompt
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_ENHANCE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`AI enhancement failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI Response:', JSON.stringify(result, null, 2));
    
    // Extract image from AI response - check all possible locations
    let imageData = null;
    
    // Try different possible response structures
    if (result.candidates?.[0]?.content?.parts) {
      const parts = result.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    
    if (!imageData) {
      // Gemini image models don't return images, they generate new ones
      // We need to use a different approach - use Sharp for upscaling
      console.log('AI image generation not supported, using Sharp upscaling...');
      
      const metadata = await sharp(buffer).metadata();
      const targetWidth = (metadata.width || 1920) * 2;
      const targetHeight = (metadata.height || 1080) * 2;
      
      var finalEnhanced: Buffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          kernel: 'lanczos3',
          fit: 'fill',
        })
        .sharpen({ sigma: 1.5, m1: 1.0, m2: 0.5 })
        .jpeg({
          quality: 95,
          chromaSubsampling: '4:4:4',
        })
        .toBuffer();
    } else {
      var finalEnhanced: Buffer = Buffer.from(imageData, 'base64');
    }

    // Save the AI-enhanced image
    const ts = Date.now();
    const outputDir = join(process.cwd(), 'public', 'output');
    
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    const fileName = `enhanced_${ts}.jpg`;
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, finalEnhanced);

    return new Response(
      JSON.stringify({
        success: true,
        url: `/output/${fileName}`,
        message: 'Image enhanced successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Enhancement error:', error);
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
