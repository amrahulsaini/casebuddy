// Pricing calculator utility (Official Gemini API Pricing - December 2024)
export const PRICING = {
  'gemini-2.0-flash': {
    inputImage: 0.10, // $0.10 per image
    outputText: 0.40, // $0.40 per 1M tokens
    outputImage: 0.039, // $0.039 per image
  },
  'gemini-2.5-flash-image': {
    inputImage: 0.30, // $0.30 per image
    outputText: 0.00,
    outputImage: 0.039, // $0.039 per image
  },
  'gemini-3-pro-image-preview': {
    inputImage: 2.00, // $2.00 per text/image input
    outputText: 12.00, // $12.00 per 1M tokens (text/thinking)
    outputImage: 0.134, // $0.134 per 1K/2K image
    outputImage4K: 0.24, // $0.24 per 4K image
  },
};

export const USD_TO_INR = 83.5;

export interface UsageCost {
  modelName: string;
  operationType: 'text_analysis' | 'image_generation' | 'image_enhancement';
  inputImages: number;
  outputImages: number;
  inputTokens?: number;
  outputTokens?: number;
  is4K?: boolean;
}

export function calculateCost(usage: UsageCost): { usd: number; inr: number } {
  const pricing = PRICING[usage.modelName as keyof typeof PRICING];
  if (!pricing) {
    return { usd: 0, inr: 0 };
  }

  let costUSD = 0;

  // Input costs (images)
  if (usage.inputImages > 0) {
    costUSD += usage.inputImages * pricing.inputImage;
  }

  // Output costs (text)
  if (usage.outputTokens && pricing.outputText > 0) {
    costUSD += (usage.outputTokens / 1000000) * pricing.outputText;
  }

  // Output costs (images)
  if (usage.outputImages > 0) {
    if (usage.is4K && 'outputImage4K' in pricing) {
      costUSD += usage.outputImages * (pricing as any).outputImage4K;
    } else {
      costUSD += usage.outputImages * pricing.outputImage;
    }
  }

  const costINR = costUSD * USD_TO_INR;

  // Display reduced cost to user (₹3.6 per generation shown in billing)
  // Actual API costs are higher but we show discounted price
  let displayCostINR = costINR;
  if (usage.operationType === 'text_analysis' || usage.operationType === 'image_generation') {
    // Check if using gemini-3-pro-image model for high quality
    if (usage.modelName === 'gemini-3-pro-image-preview') {
      // Show ₹9 per image for Ultra HD quality
      displayCostINR = 9.0;
    } else {
      // Show ₹1.8 per operation (₹3.6 total for both operations) for standard quality
      displayCostINR = 1.8;
    }
  } else if (usage.operationType === 'image_enhancement') {
    // Show ₹13 for 4K enhancement
    displayCostINR = 13.0;
  }

  return {
    usd: Math.round(costUSD * 1000000) / 1000000, // Round to 6 decimals
    inr: Math.round(displayCostINR * 100) / 100, // Display reduced price
  };
}

export async function logAPIUsage(
  userId: number,
  generationLogId: number | null,
  usage: UsageCost
): Promise<void> {
  const cost = calculateCost(usage);

  const pool = (await import('@/lib/db')).default;

  await pool.execute(
    `INSERT INTO api_usage_logs (
      user_id, generation_log_id, model_name, operation_type,
      input_tokens, output_tokens, input_images, output_images,
      cost_usd, cost_inr
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      generationLogId,
      usage.modelName,
      usage.operationType,
      usage.inputTokens || 0,
      usage.outputTokens || 0,
      usage.inputImages,
      usage.outputImages,
      cost.usd,
      cost.inr,
    ]
  );
}
