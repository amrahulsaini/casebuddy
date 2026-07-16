/**
 * API Route: /casetool/api/playground
 *
 * GET  -> returns the default assembled prompt for a case type, with a
 *         {{ANALYSIS}} token where the per-image analysis gets injected.
 * POST -> generates ONE image using the prompt text exactly as supplied, so
 *         the prompt can be edited in the browser and tested immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini,
  buildAnalysisPrompt,
  getAngleDescriptions,
  buildCaseTypePrompt,
} from '@/lib/gemini';
import { getModelByKey, apiImageSize, type Resolution } from '@/lib/image-pricing';
import { whitenBackground } from '@/lib/whiten';

const ENV_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-pro-latest';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ANALYSIS_TOKEN = '{{ANALYSIS}}';

export async function GET(request: NextRequest) {
  const caseType = request.nextUrl.searchParams.get('case_type') || 'transparent';
  const phoneModel = request.nextUrl.searchParams.get('phone_model') || 'Phone Model';
  const backColor = request.nextUrl.searchParams.get('back_color') || '';

  const angles = getAngleDescriptions(caseType);
  const angleListText = angles.map((d, i) => `${i + 1}) ${d}`).join(' ');
  const prompt = buildCaseTypePrompt(caseType, phoneModel, ANALYSIS_TOKEN, angleListText, backColor);

  return NextResponse.json({ success: true, prompt, panels: angles });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const image = form.get('image') as File | null;
    const phoneModel = ((form.get('phone_model') as string) || 'Phone Model').trim();
    const promptText = (form.get('prompt') as string) || '';
    const modelKey = (form.get('image_model') as string) || 'nano';
    const resolution = ((form.get('resolution') as string) || '1k') as Resolution;
    const runAnalysis = (form.get('run_analysis') as string) === 'true';
    const applyWhiten = (form.get('whiten') as string) !== 'false';
    const temperature = parseFloat((form.get('temperature') as string) || '0');
    const apiKey = ((form.get('api_key') as string) || '').trim() || ENV_GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ success: false, error: 'No Gemini API key. Add one in the page or set GEMINI_API_KEY.' }, { status: 400 });
    if (!image) return NextResponse.json({ success: false, error: 'Upload a reference image first.' }, { status: 400 });
    if (!promptText.trim()) return NextResponse.json({ success: false, error: 'Prompt is empty.' }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    const imgB64 = buffer.toString('base64');
    const mimeType = image.type || 'image/jpeg';

    // 1) Optional analysis step, injected into the {{ANALYSIS}} token.
    let analysisJson: any = null;
    let analysisText = '';
    if (runAnalysis) {
      const res = await callGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
        {
          contents: [{ role: 'user', parts: [
            { text: buildAnalysisPrompt(phoneModel) },
            { inlineData: { mimeType, data: imgB64 } },
          ] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
        apiKey
      );
      const raw = res.candidates[0]?.content?.parts[0]?.text || '{}';
      try { analysisJson = JSON.parse(raw); } catch { analysisJson = { raw }; }
      analysisText = analysisJson?.final_generation_prompt || '';
    }

    const finalPrompt = promptText.includes(ANALYSIS_TOKEN)
      ? promptText.replaceAll(ANALYSIS_TOKEN, analysisText || '(analysis skipped)')
      : promptText;

    // 2) Generate the image with the prompt exactly as given.
    const spec = getModelByKey(modelKey);
    const wanted: Resolution = spec.resolutions.includes(resolution) ? resolution : '1k';
    const started = Date.now();
    const imgRes = await callGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${spec.id}:generateContent`,
      {
        contents: [{ role: 'user', parts: [
          { text: finalPrompt },
          { inlineData: { mimeType, data: imgB64 } },
        ] }],
        generationConfig: {
          temperature: isNaN(temperature) ? 0 : temperature,
          topP: 0.9,
          topK: 40,
          candidateCount: 1,
          imageConfig: { imageSize: apiImageSize(wanted) },
        },
      },
      apiKey
    );

    let genB64: string | null = null;
    for (const p of imgRes.candidates[0]?.content?.parts || []) {
      if (p.inlineData?.data) { genB64 = p.inlineData.data; break; }
    }
    if (!genB64) {
      return NextResponse.json({ success: false, error: 'Model returned no image data.', finalPrompt }, { status: 502 });
    }

    let outBuffer: Buffer = Buffer.from(genB64, 'base64');
    if (applyWhiten) {
      try { outBuffer = await whitenBackground(outBuffer); }
      catch (e) { console.error('whiten failed:', e); }
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${outBuffer.toString('base64')}`,
      finalPrompt,
      analysis: analysisJson,
      modelId: spec.id,
      seconds: ((Date.now() - started) / 1000).toFixed(1),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Generation failed' }, { status: 500 });
  }
}
