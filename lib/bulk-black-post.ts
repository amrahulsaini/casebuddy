import sharp from 'sharp';
import { callGemini } from './gemini';

const VISIBLE_SHARE = 0.25;

interface Raw {
  data: Buffer;
  width: number;
  height: number;
}

async function toRaw(buffer: Buffer): Promise<Raw> {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function lum(raw: Raw, x: number, y: number): number {
  const i = (y * raw.width + x) * 3;
  return (raw.data[i] + raw.data[i + 1] + raw.data[i + 2]) / 3;
}

function darkCounts(raw: Raw, x0: number, x1: number, y0: number, y1: number): number[] {
  const counts: number[] = [];
  for (let x = x0; x < x1; x++) {
    let n = 0;
    for (let y = y0; y < y1; y++) if (lum(raw, x, y) < 100) n++;
    counts.push(n);
  }
  return counts;
}

function measurePanelOne(raw: Raw, cell: number) {
  const pad = Math.round(cell * 0.02);
  const x0 = pad, x1 = cell - pad, y0 = pad, y1 = cell - pad;
  const counts = darkCounts(raw, x0, x1, y0, y1);
  const tall = Math.max(...counts);
  if (tall < cell * 0.3) return null;

  const body = counts.map((c) => c / tall);
  let left = -1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] > 0.08) { left = i; break; }
  }
  if (left < 0) return null;

  let frontLeft = -1, right = -1, runStart = -1;
  for (let i = 0; i <= body.length; i++) {
    const solid = i < body.length && body[i] > 0.7;
    if (solid && runStart < 0) runStart = i;
    if (!solid && runStart >= 0) {
      if (i - runStart > right - frontLeft) { frontLeft = runStart; right = i - 1; }
      runStart = -1;
    }
  }
  if (frontLeft < 0) return null;

  const phoneWidth = right - frontLeft;
  const visible = frontLeft - left;
  if (phoneWidth < cell * 0.25 || phoneWidth > cell * 0.65) return null;
  if (visible < cell * 0.03 || visible > phoneWidth) return null;

  let top = y1, bottom = y0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0 + left; x <= x0 + right; x++) {
      if (lum(raw, x, y) < 100) { if (y < top) top = y; if (y > bottom) bottom = y; break; }
    }
  }
  return { left: x0 + left, right: x0 + right, frontLeft: x0 + frontLeft, phoneWidth, visible, top, bottom };
}

async function tightenOverlap(buffer: Buffer, cell: number): Promise<Buffer> {
  const raw = await toRaw(buffer);
  const m = measurePanelOne(raw, cell);
  if (!m) return buffer;

  const keep = Math.round(m.phoneWidth * VISIBLE_SHARE);
  const cut = m.visible - keep;
  if (cut < 12) return buffer;

  const edge = Math.round(cell * 0.01);
  const top = Math.max(0, m.top - edge);
  const height = Math.min(cell - top - edge, m.bottom - top + 2 * edge);
  const shift = Math.round(cut / 2);
  const leftEnd = m.left + keep;

  const strip = await sharp(buffer).removeAlpha()
    .extract({ left: edge, top, width: leftEnd - edge, height }).toBuffer();
  const rest = await sharp(buffer).removeAlpha()
    .extract({ left: m.frontLeft, top, width: cell - edge - m.frontLeft, height }).toBuffer();
  const blank = await sharp({ create: { width: cell - 2 * edge, height, channels: 3, background: '#fdfdfd' } })
    .png().toBuffer();

  return sharp(buffer).composite([
    { input: blank, left: edge, top },
    { input: strip, left: edge + shift, top },
    { input: rest, left: m.frontLeft - shift, top },
  ]).png().toBuffer();
}

function twistPrompt(): string {
  return `Product photo on pure white #FFFFFF, square, ecommerce style. The uploaded photo shows a real opaque soft TPU phone case held in a hand; copy that case exactly — its colour, matte material, camera plate shape and the exact number, size and placement of its camera and flash openings — and ignore the hand and background.
Show that EMPTY case alone, bent to demonstrate how flexible it is: it stands upright and centred, its long axis vertical with no lean. The UPPER half is seen from the case's OUTSIDE BACK, so the raised camera plate and its openings face the viewer straight on. At the waist the case makes exactly ONE half-twist, so the LOWER half turns round and shows the case's hollow inner side and bottom lip, forming a smooth hourglass silhouette. Exactly one twist — never a figure-eight, never a double loop, never a second case.
No phone inside, no hand, no text, no logo. The camera openings show the white background through them. Soft even studio light, faint contact shadow, tack sharp, deep depth of field.`;
}

async function generateTwist(apiKey: string, modelId: string, refB64: string, refMime: string): Promise<Buffer | null> {
  const res = await callGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    {
      contents: [{
        role: 'user',
        parts: [
          { text: twistPrompt() },
          { inlineData: { mimeType: refMime, data: refB64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        candidateCount: 1,
        imageConfig: { imageSize: '1K', aspectRatio: '1:1' },
      },
    },
    apiKey
  );
  const part = (res.candidates[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  return part ? Buffer.from(part.inlineData!.data, 'base64') : null;
}

async function textBottom(buffer: Buffer, cell: number): Promise<number> {
  const raw = await toRaw(buffer);
  const x0 = Math.round(cell * 0.02), x1 = cell - x0;
  const start = cell + Math.round(cell * 0.02);
  const limit = cell + Math.round(cell * 0.35);
  let last = 0, blank = 0;
  for (let y = start; y < limit; y++) {
    let n = 0;
    for (let x = x0; x < x1; x++) if (lum(raw, x, y) < 128) n++;
    if (n > 3) {
      last = y;
      blank = 0;
    } else if (last) {
      blank++;
      if (blank > 12) break;
    }
  }
  return last || cell + Math.round(cell * 0.18);
}

async function replaceTwistPanel(buffer: Buffer, cell: number, twist: Buffer): Promise<Buffer> {
  const gap = Math.round(cell * 0.02);
  const top = (await textBottom(buffer, cell)) + gap;
  const edge = Math.round(cell * 0.01);
  const height = 2 * cell - top - edge;
  if (height < cell * 0.4) return buffer;

  const fitted = await sharp(twist).removeAlpha().trim({ threshold: 20 })
    .resize({ height: Math.round(height * 0.94) })
    .linear(253 / 255, 0)
    .toBuffer({ resolveWithObject: true });
  const blank = await sharp({ create: { width: cell - 2 * edge, height, channels: 3, background: '#fdfdfd' } })
    .png().toBuffer();

  return sharp(buffer).composite([
    { input: blank, left: edge, top },
    { input: fitted.data, left: Math.round(cell / 2 - fitted.info.width / 2), top: top + Math.round(height * 0.03) },
  ]).png().toBuffer();
}

export async function refineBlackGrid(
  buffer: Buffer,
  opts: { apiKey: string; modelId: string; refB64: string; refMime: string }
): Promise<{ buffer: Buffer; twistCalls: number }> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0, height = meta.height || 0;
  if (!width || Math.abs(width - height) > 4) return { buffer, twistCalls: 0 };
  const cell = Math.round(width / 2);

  let out = buffer;
  try {
    out = await tightenOverlap(out, cell);
  } catch (e) {
    console.error('bulk black overlap fix failed:', e);
  }

  let twistCalls = 0;
  try {
    const twist = await generateTwist(opts.apiKey, opts.modelId, opts.refB64, opts.refMime);
    twistCalls = 1;
    if (twist) out = await replaceTwistPanel(out, cell, twist);
  } catch (e) {
    console.error('bulk black twist panel failed:', e);
  }

  return { buffer: out, twistCalls };
}
