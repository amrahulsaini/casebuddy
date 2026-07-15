/**
 * Local test harness: generates mockups for real reference images using the
 * exact same prompt code path as the app, then writes the outputs to a folder
 * so they can be inspected.
 *
 * Usage:
 *   npx tsx scripts/test-mockups.ts <srcDir> <outDir> [count] [modelKey] [start]
 *
 * Needs GEMINI_API_KEY in .env.local, .env, or the environment.
 */
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import {
  callGemini, buildAnalysisPrompt, getAngleDescriptions, buildCaseTypePrompt,
} from '../lib/gemini';
import { getModelByKey, apiImageSize } from '../lib/image-pricing';

function loadKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  for (const f of ['.env.local', '.env']) {
    if (existsSync(f)) {
      const m = readFileSync(f, 'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*(.+)\s*$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('GEMINI_API_KEY not found. Put it in .env.local as GEMINI_API_KEY=your_key');
}

const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-pro-latest';
const CASE_TYPE = 'transparent';

async function generateOne(
  apiKey: string, imgPath: string, outDir: string, modelKey: string
) {
  const phoneModel = basename(imgPath, extname(imgPath));
  const buffer = await readFile(imgPath);
  const imgB64 = buffer.toString('base64');
  const mimeType = 'image/jpeg';

  // 1) analysis
  const analysisRes = await callGemini(
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
  const rawText = analysisRes.candidates[0]?.content?.parts[0]?.text || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(rawText); } catch { /* noop */ }
  const finalPrompt = parsed.final_generation_prompt ||
    `Ultra realistic product photos of ${phoneModel} in the exact case from the reference.`;

  // 2) grid prompt (same builder the app uses)
  const angles = getAngleDescriptions(CASE_TYPE);
  const angleListText = angles.map((d, i) => `${i + 1}) ${d}`).join(' ');
  const gridPrompt = buildCaseTypePrompt(CASE_TYPE, phoneModel, finalPrompt, angleListText, '');

  // 3) image
  const spec = getModelByKey(modelKey);
  const imgRes = await callGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${spec.id}:generateContent`,
    {
      contents: [{ role: 'user', parts: [
        { text: gridPrompt },
        { inlineData: { mimeType, data: imgB64 } },
      ] }],
      generationConfig: {
        temperature: 0,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
        imageConfig: { imageSize: apiImageSize('1k') },
      },
    },
    apiKey
  );

  let genB64: string | null = null;
  for (const p of imgRes.candidates[0]?.content?.parts || []) {
    if (p.inlineData?.data) { genB64 = p.inlineData.data; break; }
  }
  if (!genB64) throw new Error('no image data');

  const outPath = join(outDir, `${phoneModel.replace(/[^a-z0-9]+/gi, '_')}.png`);
  await writeFile(outPath, Buffer.from(genB64, 'base64'));

  // Save the analysis so we can see what the model thinks the case looks like
  await writeFile(join(outDir, `${phoneModel.replace(/[^a-z0-9]+/gi, '_')}.analysis.txt`),
    JSON.stringify(parsed, null, 2));

  return outPath;
}

async function main() {
  const [srcDir, outDir, countArg, modelArg, startArg] = process.argv.slice(2);
  if (!srcDir || !outDir) {
    console.error('Usage: tsx scripts/test-mockups.ts <srcDir> <outDir> [count] [modelKey] [start]');
    process.exit(1);
  }
  const count = parseInt(countArg || '5', 10);
  const start = parseInt(startArg || '0', 10);
  const modelKey = modelArg || 'nano';
  const apiKey = loadKey();

  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir))
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(start, start + count);

  console.log(`Generating ${files.length} mockups with ${getModelByKey(modelKey).id}\n`);
  let ok = 0;
  for (const f of files) {
    process.stdout.write(`- ${f} ... `);
    try {
      await generateOne(apiKey, join(srcDir, f), outDir, modelKey);
      ok++;
      console.log('OK');
    } catch (e: any) {
      console.log('FAIL: ' + (e?.message || e).slice(0, 160));
    }
  }
  console.log(`\nDone: ${ok}/${files.length} -> ${outDir}`);
}

main().catch(e => { console.error(e); process.exit(1); });
