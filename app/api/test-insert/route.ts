import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { callGemini } from '@/lib/gemini';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';
const IMAGE_ENHANCE_MODEL =
  process.env.IMAGE_ENHANCE_MODEL || 'gemini-3-pro-image-preview';

function sanitizeFileName(name: string) {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function extensionFromMime(mimeType: string | undefined) {
  const type = (mimeType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  return 'jpg';
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[a-z0-9]{2,5}$/i, '');
}

type Aspect = '1:1' | '4:5' | '16:9';
type Mode = 'single' | 'collage';

function buildInsertPhonePrompt(phoneModel: string) {
  return (
    `Using the provided reference image of a PRINTED PHONE CASE (straight-on packshot), create a single ultra-realistic e-commerce product image where a phone is perfectly inserted into THIS exact case.\n\n` +
    `PHONE MODEL LABEL: "${phoneModel}" (treat as label only; do not use catalog specs if they conflict with the case cutouts).\n\n` +
    `CRITICAL RULES (do not break):\n` +
    `- Preserve the case silhouette, camera island position, and ALL cutouts exactly as in the reference image.\n` +
    `- Preserve the printed design exactly (same colors, same placement, no redesign, no shifting).\n` +
    `- Add ONLY the phone body inside the case; keep viewpoint straight-on and keep lighting/background consistent.\n` +
    `- The phone must fit 100% inside the inner silhouette (no floating, no intersections).\n` +
    `- Do not add extra holes/sensors/rings/logos.\n` +
    `- No text, no labels, no watermark.\n\n` +
    `OUTPUT: one clean studio product image (Amazon-style).`
  );
}

function buildInsertPhoneCollagePrompt(phoneModel: string) {
  const angles = [
    'Panel 1 (Hero): phone inserted, back-facing 3/4 rear angle, centered, clean studio background. Focus on camera cutouts and perfect fit.',
    'Panel 2 (Back straight-on): phone inserted, perfectly straight-on back view, full case visible, maximum geometric accuracy.',
    'Panel 3 (Camera macro): close-up crop of camera island and surrounding case, show lenses perfectly centered in openings.',
    'Panel 4 (Side buttons): close-up of side edge showing button cutouts and thickness, no distortion.',
    'Panel 5 (Flat lay): case + phone inserted OR case alone flat lay (choose the most realistic), top-down technical clarity.',
  ].map((d, i) => `${i + 1}) ${d}`).join(' ');

  return (
    `Using the provided reference image of a PRINTED PHONE CASE (straight-on packshot), generate ONE single Amazon-style product collage image with EXACTLY five panels arranged in a clean 5-tile grid.\n\n` +
    `PHONE MODEL LABEL: "${phoneModel}" (treat as label only; do not use catalog specs if they conflict with the case cutouts).\n\n` +
    `CRITICAL RULES (do not break):\n` +
    `- Preserve the case silhouette, camera island position, and ALL cutouts exactly as in the reference image.\n` +
    `- Preserve the printed design exactly (same colors, same placement, no redesign, no shifting).\n` +
    `- When the phone is shown inserted: phone must fit 100% inside the case (no floating, no intersections).\n` +
    `- Across all panels, depict the SAME exact phone+case geometry by reusing one identical 3D asset; only rotate or crop it.\n` +
    `- Do NOT redraw or reinterpret the camera layout per panel.\n` +
    `- No text, no labels, no zoom bubbles, no watermark.\n` +
    `- No hands, no accessories, no extra devices.\n` +
    `- No fisheye, no perspective warping, no stretched proportions.\n\n` +
    `Panels must follow: ${angles}`
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const phoneModel = (formData.get('phone_model') as string) || 'Unknown Model';
    const caseImage = formData.get('case_image') as File;
    const imageModelChoice = (formData.get('image_model') as string) || 'normal';
    const aspectRatio = ((formData.get('aspect_ratio') as string) || '4:5') as Aspect;
    const mode = ((formData.get('mode') as string) || 'single') as Mode;

    if (!caseImage) {
      return NextResponse.json(
        { status: 'error', message: 'Image upload failed' },
        { status: 400 }
      );
    }

    const selectedImageModel =
      imageModelChoice === 'high' ? IMAGE_ENHANCE_MODEL : IMAGE_MODEL;

    const startTime = Date.now();

    const arrayBuffer = await caseImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imgB64 = buffer.toString('base64');

    const editPrompt =
      mode === 'collage'
        ? buildInsertPhoneCollagePrompt(phoneModel)
        : buildInsertPhonePrompt(phoneModel);

    const imgPayload: any = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: caseImage.type || 'image/jpeg',
                data: imgB64,
              },
            },
            { text: editPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.15,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
      },
    };

    // If the backend/model supports these fields, they help keep output clean.
    imgPayload.generationConfig.responseModalities = ['Image'];
    // Collage looks best wide; if user picked 4:5 for collage, we keep it as-is.
    imgPayload.generationConfig.imageConfig = { aspectRatio };

    const imgRes = await callGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedImageModel}:generateContent`,
      imgPayload,
      GEMINI_API_KEY
    );

    let genB64: string | null = null;
    let genMimeType: string | undefined;
    const parts = imgRes.candidates[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        genB64 = p.inlineData.data;
        genMimeType = p.inlineData.mimeType;
        break;
      }
    }

    if (!genB64) {
      return NextResponse.json(
        { status: 'error', message: 'No image data returned by model' },
        { status: 500 }
      );
    }

    const outputDir = join(process.cwd(), 'public', 'output');
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    const sessionId = uuidv4();
    const originalBaseName = sanitizeFileName(caseImage.name || 'upload');
    const safeStem = stripExtension(originalBaseName) || 'upload';
    const outExt = extensionFromMime(genMimeType);
    const fileName = `test_insert_${mode}_${sessionId}_${Date.now()}_${safeStem}.${outExt}`;
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, Buffer.from(genB64, 'base64'));

    const generationTimeSec = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      status: 'ok',
      imageUrl: `/output/${fileName}`,
      generationTimeSec,
      selectedImageModel,
      prompts: {
        editPrompt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
