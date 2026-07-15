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
  id: 'gemini-3-pro-preview',
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

export const USD_TO_INR = Number(process.env.NEXT_PUBLIC_USD_TO_INR || 88);

export function getModelByKey(key: string): ImageModelSpec {
  return IMAGE_MODELS.find(m => m.key === key) || IMAGE_MODELS[1];
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
