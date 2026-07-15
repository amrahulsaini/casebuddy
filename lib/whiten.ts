/**
 * Deterministic white cleanup for clear-case mockups.
 *
 * Even at temperature 0, the image model intermittently renders the studio
 * background as off-white (#F5F5F5) and lays a faint grey gloss wash across the
 * empty case. Prompt wording alone does not fix this reliably, so we clean it
 * up in post: any near-white, low-saturation pixel is snapped to pure white.
 *
 * Deliberately conservative — it only touches pixels that are already almost
 * white AND almost neutral, so vivid phone bodies, dark camera modules, case
 * outlines, and screen artwork are left untouched.
 */
import sharp from 'sharp';

export interface WhitenOptions {
  /** Min channel value for a pixel to count as "near white" (0-255). */
  threshold?: number;
  /** Max channel spread for a pixel to count as neutral/grey (not coloured). */
  neutralTolerance?: number;
}

export async function whitenBackground(
  input: Buffer,
  opts: WhitenOptions = {}
): Promise<Buffer> {
  const threshold = opts.threshold ?? 232;
  const neutralTolerance = opts.neutralTolerance ?? 14;

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    // Near-white AND neutral (no colour cast) -> snap to pure white.
    if (min >= threshold && max - min <= neutralTolerance) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
