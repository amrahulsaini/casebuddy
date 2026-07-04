/**
 * API Route: /casetool/api/bulk-generate
 * Single-image generation for the bulk tool. Non-streaming: takes one
 * reference image + model name, runs analysis + grid generation, saves the
 * result and returns a JSON payload. Reuses the exact same prompt logic as
 * the main generate route via the shared lib helpers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  callGemini,
  buildAnalysisPrompt,
  getAngleDescriptions,
  buildCaseTypePrompt,
} from '@/lib/gemini';
import pool from '@/lib/db';
import { ensureBulkTable } from '@/lib/bulk-table';

const ENV_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3-pro-preview';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';
const IMAGE_ENHANCE_MODEL = process.env.IMAGE_ENHANCE_MODEL || 'gemini-3-pro-image-preview';
const IMAGE_NANO_MODEL = process.env.IMAGE_NANO_MODEL || 'gemini-3.1-flash-image-preview';

export const runtime = 'nodejs';
export const maxDuration = 300;

function sanitizeFileName(name: string) {
  return name
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'model';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneModel = (formData.get('phone_model') as string) || 'Unknown Model';
    const caseImage = formData.get('case_image') as File;
    const caseType = (formData.get('case_type') as string) || 'transparent';
    const backColor = ((formData.get('back_color') as string) || '').trim();
    const imageModel = (formData.get('image_model') as string) || 'normal';
    const reusePrompt = (formData.get('reuse_prompt') as string | null) || null;
    const customPrompt = ((formData.get('custom_prompt') as string) || '').trim();
    const apiKey = ((formData.get('api_key') as string) || '').trim() || ENV_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'No Gemini API key provided. Set it in the bulk page settings.' }, { status: 400 });
    }
    if (!caseImage) {
      return NextResponse.json({ success: false, error: 'No reference image uploaded.' }, { status: 400 });
    }

    const selectedImageModel =
      imageModel === 'high' ? IMAGE_ENHANCE_MODEL : imageModel === 'nano' ? IMAGE_NANO_MODEL : IMAGE_MODEL;

    const arrayBuffer = await caseImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imgB64 = buffer.toString('base64');
    const mimeType = caseImage.type || 'image/jpeg';

    // 1. Determine the master prompt (reuse, custom, or fresh analysis)
    let finalPrompt: string;
    if (reusePrompt) {
      finalPrompt = reusePrompt;
    } else {
      const analysisPrompt = buildAnalysisPrompt(phoneModel);
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType, data: imgB64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      };
      const res = await callGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
        payload,
        apiKey
      );
      const rawText = res.candidates[0]?.content?.parts[0]?.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }
      finalPrompt =
        parsed.final_generation_prompt ||
        `Ultra realistic Amazon-style product photos of ${phoneModel} fully inserted in the exact same phone case as the reference image.`;
    }

    // 2. Build the grid prompt. A per-row custom instruction is appended so the
    // user can steer individual regenerations from the bulk page.
    const angleDescriptions = getAngleDescriptions(caseType);
    const angleListText = angleDescriptions.map((desc, idx) => `${idx + 1}) ${desc}`).join(' ');
    let gridPrompt = buildCaseTypePrompt(caseType, phoneModel, finalPrompt, angleListText, backColor);
    if (customPrompt) {
      gridPrompt += `\n\nADDITIONAL USER INSTRUCTION (HIGH PRIORITY, applies on top of everything above):\n${customPrompt}`;
    }

    // 3. Generate the grid image
    const imgPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: gridPrompt },
            { inlineData: { mimeType, data: imgB64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, topP: 0.9, topK: 40, candidateCount: 1 },
    };
    const imgRes = await callGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedImageModel}:generateContent`,
      imgPayload,
      apiKey
    );

    let genB64: string | null = null;
    const parts = imgRes.candidates[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        genB64 = p.inlineData.data;
        break;
      }
    }
    if (!genB64) {
      return NextResponse.json({ success: false, error: 'Model returned no image data.', prompt: finalPrompt }, { status: 502 });
    }

    // 4. Save under public/output/bulk
    const outputDir = join(process.cwd(), 'public', 'output', 'bulk');
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    const base = sanitizeFileName(caseImage.name || phoneModel);
    const fileName = `${base}_${Date.now()}.png`;
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, Buffer.from(genB64, 'base64'));
    // Serve through an API route so previews work in production too (Next does
    // not statically serve files written to /public after build).
    const imageUrl = `/casetool/api/bulk-file?name=${encodeURIComponent(fileName)}`;

    // Persist/Upsert the result. Keep any existing right/wrong mark intact.
    try {
      await ensureBulkTable(pool);
      await pool.execute(
        `INSERT INTO bulk_generations
           (file_name, model_name, case_type, gen_file, gen_url, file_base, prompt, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'done')
         ON DUPLICATE KEY UPDATE
           model_name = VALUES(model_name),
           gen_file   = VALUES(gen_file),
           gen_url    = VALUES(gen_url),
           file_base  = VALUES(file_base),
           prompt     = VALUES(prompt),
           status     = 'done'`,
        [caseImage.name || base, phoneModel, caseType, fileName, imageUrl, base, finalPrompt]
      );
    } catch (e) {
      // Don't fail the generation if the table isn't migrated yet.
      console.error('bulk_generations upsert failed:', e);
    }

    return NextResponse.json({ success: true, url: imageUrl, prompt: finalPrompt, fileBase: base });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Generation failed' }, { status: 500 });
  }
}
