/**
 * Gemini image-generation pricing (official paid-tier rates).
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Client-safe: pure data + pure functions only (no DB imports), so it can be
 * imported by both API routes and client components.
 */

export type Resolution = '1k' | '2k' | '4k';

export interface ImageModelSpec {
  /** Quality key used by the UI / form field */
  key: string;
  /** Exact Gemini model id */
  id: string;
  label: string;
  note: string;
  /** USD per 1M input tokens (text + image input) */
  inputPerMTokens: number;
  /** USD per generated image, by resolution */
  outputImage: Partial<Record<Resolution, number>>;
  /** Resolutions this model supports */
  resolutions: Resolution[];
}

export const IMAGE_MODELS: ImageModelSpec[] = [
  {
    key: 'lite',
    id: 'gemini-3.1-flash-lite-image',
    label: 'Nano Banana 2 Lite',
    note: 'Fastest and cheapest. 1K only — best for large bulk runs.',
    inputPerMTokens: 0.25,
    outputImage: { '1k': 0.0336 },
    resolutions: ['1k'],
  },
  {
    key: 'normal',
    id: 'gemini-2.5-flash-image',
    label: 'Nano Banana (2.5 Flash)',
    note: 'Legacy model. Flat per-image price.',
    inputPerMTokens: 0.30,
    outputImage: { '1k': 0.039, '2k': 0.039, '4k': 0.039 },
    resolutions: ['1k', '2k', '4k'],
  },
  {
    key: 'nano',
    id: 'gemini-3.1-flash-image',
    label: 'Nano Banana 2',
    note: 'Balanced quality/price. Up to 4K, strong text rendering.',
    inputPerMTokens: 0.50,
    outputImage: { '1k': 0.067, '2k': 0.101, '4k': 0.151 },
    resolutions: ['1k', '2k', '4k'],
  },
  {
    key: 'high',
    id: 'gemini-3-pro-image',
    label: 'Nano Banana Pro',
    note: 'Highest quality and best prompt adherence. Most expensive.',
    inputPerMTokens: 2.00,
    outputImage: { '1k': 0.134, '2k': 0.134, '4k': 0.24 },
    resolutions: ['1k', '2k', '4k'],
  },
];

/** Text model used for the reference-image analysis step. */
export const TEXT_MODEL_PRICING = {
  id: 'gemini-pro-latest',
  inputPerMTokens: 2.0,
  outputPerMTokens: 12.0,
};

/**
 * Token estimates for one mockup generation. These are approximations — the
 * exact count depends on the reference image size and prompt length.
 */
export const TOKEN_ESTIMATES = {
  refImageTokens: 560,      // one reference image input
  gridPromptTokens: 1500,   // our long transparent prompt
  analysisPromptTokens: 900,
  analysisOutputTokens: 700,
};

export const USD_TO_INR = Number(process.env.NEXT_PUBLIC_USD_TO_INR || 96);

/**
 * Billed rupee rate charged per image API call, by model key.
 * These are fixed business rates (not derived from token math) — every image
 * API call, including retries and regenerations, is counted at this rate.
 */
export const RATE_INR: Record<string, number> = {
  lite: 7.32,    // Nano Banana 2 Lite
  normal: 3.65,  // Nano Banana (2.5 Flash)
  nano: 6.54,    // Nano Banana 2
  high: 12.35,   // Nano Banana Pro
};

export function getRateInr(modelKey: string): number {
  return RATE_INR[modelKey] ?? RATE_INR.normal;
}

export function getModelByKey(key: string): ImageModelSpec {
  return IMAGE_MODELS.find(m => m.key === key) || IMAGE_MODELS[1];
}

/** API value for the requested image size — must be uppercase K. */
export function apiImageSize(r: Resolution): string {
  return r.toUpperCase(); // '1K' | '2K' | '4K'
}

/**
 * Classify an actually-generated image into its billing tier from its real
 * pixel dimensions, so cost reflects what Google actually produced.
 */
export function classifyResolution(width: number, height: number): Resolution {
  const longest = Math.max(width || 0, height || 0);
  if (longest <= 1536) return '1k';
  if (longest <= 3072) return '2k';
  return '4k';
}

export interface CostBreakdown {
  analysisUsd: number;
  inputUsd: number;
  outputImageUsd: number;
  totalUsd: number;
  totalInr: number;
}

/**
 * Estimated cost of generating ONE mockup image.
 * Includes the analysis call (unless skipped) + image input + image output.
 */
export function estimateGenerationCost(
  modelKey: string,
  opts: { resolution?: Resolution; withAnalysis?: boolean } = {}
): CostBreakdown {
  const resolution = opts.resolution || '1k';
  const withAnalysis = opts.withAnalysis !== false;
  const model = getModelByKey(modelKey);

  const t = TOKEN_ESTIMATES;

  // Analysis step (text model reads the reference image, returns JSON)
  const analysisInTokens = t.refImageTokens + t.analysisPromptTokens;
  const analysisUsd = withAnalysis
    ? (analysisInTokens / 1e6) * TEXT_MODEL_PRICING.inputPerMTokens +
      (t.analysisOutputTokens / 1e6) * TEXT_MODEL_PRICING.outputPerMTokens
    : 0;

  // Image generation input (prompt + reference image)
  const genInTokens = t.refImageTokens + t.gridPromptTokens;
  const inputUsd = (genInTokens / 1e6) * model.inputPerMTokens;

  // Image output
  const outputImageUsd =
    model.outputImage[resolution] ?? model.outputImage['1k'] ?? 0;

  const totalUsd = analysisUsd + inputUsd + outputImageUsd;
  return {
    analysisUsd: round6(analysisUsd),
    inputUsd: round6(inputUsd),
    outputImageUsd: round6(outputImageUsd),
    totalUsd: round6(totalUsd),
    totalInr: Math.round(totalUsd * USD_TO_INR * 100) / 100,
  };
}

function round6(n: number) {
  return Math.round(n * 1e6) / 1e6;
}
