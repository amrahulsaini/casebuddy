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
import {
  getModelByKey, getRateInr, apiImageSize, classifyResolution, type Resolution,
} from '@/lib/image-pricing';
import sharp from 'sharp';

const ENV_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3-pro-preview';

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

    const modelSpec = getModelByKey(imageModel);
    const selectedImageModel = modelSpec.id;

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

    // 3. Generate the grid image. imageConfig.imageSize asks for the requested
    // resolution; models that don't support it fall back to their default.
    const requested = ((formData.get('resolution') as string) || '1k') as Resolution;
    const wanted = modelSpec.resolutions.includes(requested) ? requested : '1k';
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
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
        imageConfig: { imageSize: apiImageSize(wanted) },
      },
    };
    const imgRes = await callGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedImageModel}:generateContent`,
      imgPayload,
      apiKey
    );

    // Bill the image API call the moment it completes — every call counts,
    // including retries and regenerations, whether or not it returned usable
    // image data (the request was still made and charged).
    const callRate = getRateInr(imageModel);
    const logCall = async (status: string, genFile?: string, genUrl?: string) => {
      try {
        await ensureBulkTable(pool);
        await pool.execute(
          `INSERT INTO bulk_api_calls
             (case_type, file_name, model_name, image_model, model_key, model_label, cost_inr, status, gen_file, gen_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [caseType, caseImage.name || null, phoneModel, selectedImageModel,
           imageModel, modelSpec.label, callRate, status, genFile || null, genUrl || null]
        );
      } catch (e) {
        console.error('bulk_api_calls log failed:', e);
      }
    };

    let genB64: string | null = null;
    const parts = imgRes.candidates[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        genB64 = p.inlineData.data;
        break;
      }
    }
    if (!genB64) {
      await logCall('no_image');
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
    const genBuffer = Buffer.from(genB64, 'base64');
    await writeFile(filePath, genBuffer);

    // Measure what was ACTUALLY produced so billing reflects reality rather
    // than what was requested (models may ignore/clamp the requested size).
    let genWidth = 0, genHeight = 0;
    try {
      const meta = await sharp(genBuffer).metadata();
      genWidth = meta.width || 0;
      genHeight = meta.height || 0;
    } catch { /* fall back to the requested size */ }
    const actualRes: Resolution = genWidth && genHeight
      ? classifyResolution(genWidth, genHeight)
      : wanted;
    // Serve through an API route so previews work in production too (Next does
    // not statically serve files written to /public after build).
    const imageUrl = `/casetool/api/bulk-file?name=${encodeURIComponent(fileName)}`;

    // Bill this call now that we know which image it produced, so every
    // attempt keeps its own generated image in the billing log.
    await logCall('success', fileName, imageUrl);

    // Billed at the fixed per-call rate for the selected model.
    const cost = { totalInr: callRate, totalUsd: 0 };

    // Persist/Upsert the result. Keep any existing right/wrong mark intact.
    try {
      await ensureBulkTable(pool);
      await pool.execute(
        `INSERT INTO bulk_generations
           (file_name, model_name, case_type, gen_file, gen_url, file_base, prompt, status,
            image_model, cost_usd, cost_inr, gen_width, gen_height, resolution)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'done', ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           model_name  = VALUES(model_name),
           gen_file    = VALUES(gen_file),
           gen_url     = VALUES(gen_url),
           file_base   = VALUES(file_base),
           prompt      = VALUES(prompt),
           status      = 'done',
           image_model = VALUES(image_model),
           cost_usd    = VALUES(cost_usd),
           cost_inr    = VALUES(cost_inr),
           gen_width   = VALUES(gen_width),
           gen_height  = VALUES(gen_height),
           resolution  = VALUES(resolution)`,
        [caseImage.name || base, phoneModel, caseType, fileName, imageUrl, base, finalPrompt,
         selectedImageModel, cost.totalUsd, cost.totalInr, genWidth, genHeight, actualRes]
      );
    } catch (e) {
      // Don't fail the generation if the table isn't migrated yet.
      console.error('bulk_generations upsert failed:', e);
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      prompt: finalPrompt,
      fileBase: base,
      cost,
      modelId: selectedImageModel,
      width: genWidth,
      height: genHeight,
      resolution: actualRes,
      requestedResolution: wanted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Generation failed' }, { status: 500 });
  }
}
