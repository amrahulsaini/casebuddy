/**
 * API Route: /tool/api/auto-crop
 * Auto-splits composite images using AI bounding boxes
 */

import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { callGemini, buildBoundingBoxPrompt } from '@/lib/gemini';
import { cropAndUpscaleRegions, Region } from '@/lib/image-processing';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-2.0-flash';

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('API Key not configured');
    }

    const formData = await request.formData();
    const imageUrl = formData.get('image_url') as string;

    if (!imageUrl) {
      throw new Error('No image URL supplied for auto-crop');
    }

    // Convert URL to filesystem path - use static paths to avoid Turbopack warnings
    const relPath = imageUrl.replace(/^\//, '');
    const publicDir = 'public';
    const imagePath = join(process.cwd(), publicDir, relPath);

    if (!existsSync(imagePath)) {
      throw new Error('Image file not found on server');
    }

    const imgData = await readFile(imagePath);
    const imgB64 = imgData.toString('base64');

    // Get mime type
    let mimeType = 'image/png';
    if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (imagePath.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    // Ask Gemini for bounding boxes
    const bboxPrompt = buildBoundingBoxPrompt();

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: bboxPrompt },
            {
              inlineData: {
                mimeType,
                data: imgB64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const res = await callGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
      payload,
      GEMINI_API_KEY
    );

    const raw = res.candidates[0]?.content?.parts[0]?.text || '{}';
    const parsed = JSON.parse(raw);

    if (!parsed.regions || !Array.isArray(parsed.regions)) {
      throw new Error('Invalid region JSON from AI');
    }

    const regions: Region[] = parsed.regions;

    // Crop and upscale regions using canvas
    const croppedResults = await cropAndUpscaleRegions(imagePath, regions);

    const publicDir = 'public';
    const outputSubDir = 'output';
    const outputDir = join(process.cwd(), publicDir, outputSubDir);
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    const ts = Date.now();
    const outUrls = [];

    for (const result of croppedResults) {
      const fileName = `auto_slice_hd_${ts}_${result.id}.png`;
      const outPath = join(outputDir, fileName);
      await writeFile(outPath, result.buffer);

      outUrls.push({
        id: result.id,
        label: result.label,
        url: `/${outputSubDir}/${fileName}`,
      });
    }

    if (outUrls.length === 0) {
      throw new Error('No valid regions were produced by AI');
    }

    return NextResponse.json({
      status: 'ok',
      slices: outUrls,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'An error occurred',
      },
      { status: 400 }
    );
  }
}
