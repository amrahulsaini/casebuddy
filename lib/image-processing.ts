/**
 * Image Processing Utilities using Sharp
 */

import sharp from 'sharp';

export interface Region {
  id: number | string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropAndUpscaleRegions(
  imagePath: string,
  regions: Region[]
): Promise<Array<{ id: string | number; label: string; buffer: Buffer }>> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const imgWidth = metadata.width || 1;
  const imgHeight = metadata.height || 1;

  const results: Array<{ id: string | number; label: string; buffer: Buffer }> = [];
  const targetSize = 1024;

  for (const region of regions) {
    const xNorm = Math.max(0, Math.min(1, region.x));
    const yNorm = Math.max(0, Math.min(1, region.y));
    const wNorm = Math.max(0, Math.min(1, region.width));
    const hNorm = Math.max(0, Math.min(1, region.height));

    let pxX = Math.round(xNorm * imgWidth);
    let pxY = Math.round(yNorm * imgHeight);
    let pxW = Math.round(wNorm * imgWidth);
    let pxH = Math.round(hNorm * imgHeight);

    if (pxW <= 0 || pxH <= 0) continue;

    // Clamp to image bounds
    pxX = Math.max(0, pxX);
    pxY = Math.max(0, pxY);
    if (pxX + pxW > imgWidth) pxW = imgWidth - pxX;
    if (pxY + pxH > imgHeight) pxH = imgHeight - pxY;

    // Crop the region
    const cropped = sharp(imagePath).extract({
      left: pxX,
      top: pxY,
      width: pxW,
      height: pxH,
    });

    // Calculate scaling
    const scale = Math.min(targetSize / pxW, targetSize / pxH);
    const newW = Math.round(pxW * scale);
    const newH = Math.round(pxH * scale);

    // Resize and place on canvas
    const buffer = await cropped
      .resize(newW, newH, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: Math.round((targetSize - newH) / 2),
        bottom: Math.round((targetSize - newH) / 2),
        left: Math.round((targetSize - newW) / 2),
        right: Math.round((targetSize - newW) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    results.push({
      id: region.id,
      label: region.label + ' (HD)',
      buffer,
    });
  }

  return results;
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}
