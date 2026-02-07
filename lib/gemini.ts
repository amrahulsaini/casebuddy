/**
 * Gemini API Client
 */

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

export async function callGemini(
  url: string,
  payload: any,
  apiKey: string
): Promise<GeminiResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export function buildAnalysisPrompt(phoneModel: string): string {
  return `You are creating product photos for a phone case seller.

SITUATION: The seller uploaded a photo of their ACTUAL PHYSICAL CASE they want to sell. They want to show what this case looks like when "${phoneModel}" phone is inserted into it.

STEP 1: Research "${phoneModel}" phone specs
- Camera count (2, 3, 4, 5?)
- Torch light? (yes/no)
- Camera arrangement (vertical, grid, etc.)
- Camera position (top-left, center, etc.)

STEP 2: Analyze the ACTUAL case in the uploaded image - BE VERY SPECIFIC
- Frame color: What is the EXACT color of the frame/edges? (grey, olive, tan, beige, black, white, etc.) - BE PRECISE
- Center panel: Is it transparent/clear? What transparency level?
- Material finish: Matte? Glossy? Textured?
- Camera cutout: Exact shape, color, and position
- Any patterns, textures, or special features

🚨 CRITICAL: Your case_description will be used to recreate this case. Be extremely detailed about colors, especially frame color.

STEP 3: Create generation prompt
- Start with camera count for ${phoneModel}
- Then describe EXACT case appearance from image (specific colors, transparency, etc.)

Return JSON:

{
  "phone_model_camera_specs": {
    "model_name": "${phoneModel}",
    "rear_camera_count": 3,
    "has_torch_light": true,
    "camera_arrangement": "vertical",
    "camera_island_shape": "rectangular",
    "camera_module_position": "top-left",
    "lens_sizes": "main + ultrawide + macro"
  },
  "phone_model_description": "${phoneModel} has 2 vertical cameras at top-left with torch",
  "case_description": "DETAILED description: Frame color is [exact color like grey/olive/tan], center is [transparent/opaque/pattern], material is [matte/glossy], etc.",
  "final_generation_prompt": "⚠️ ${phoneModel} CAMERA COUNT ⚠️\\n2 CAMERAS ONLY\\n1 TORCH\\nTOTAL: 3 circles\\nVertical, top-left\\n\\n🎨 CASE FROM REFERENCE IMAGE 🎨\\nFrame: [exact color]\\nCenter: [transparent/opaque]\\nMaterial: [matte/glossy]\\n\\n⚠️ USE REFERENCE IMAGE AS VISUAL TEMPLATE - COPY EXACT COLORS ⚠️"
}

Make case description VERY detailed with specific colors.`;
}

export function buildBoundingBoxPrompt(): string {
  return `You will receive a single composite product image that may contain between 2 and 8 separate phone-case product shots (sub-images) arranged in an arbitrary layout.

Your task:
- Find each distinct sub-image (each separate phone/case view or tile).
- For each one, return a tight-fitting bounding box around that sub-image.

Coordinates:
- Use normalized coordinates relative to the full image size.
- x, y = top-left corner, as floats in [0, 1].
- width, height = box size, as floats in (0, 1].
- Do not make width or height zero.
- Ensure boxes do not overlap heavily; each sub-image should be isolated.

Return STRICT JSON with this exact structure:

{
  "regions": [
    { "id": 1, "label": "angle_1", "x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0 },
    { "id": 2, "label": "angle_2", "x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0 }
  ]
}

Rules:
- Do NOT output any explanation text.
- Do NOT include markdown.
- Always return at least one region.`;
}

export const ANGLE_DESCRIPTIONS: Record<string, string[]> = {
  doyers: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle. LEFT: Back view - Phone with EXACT case from reference (SAME colors, SAME design, SAME patterns, SAME materials). CRITICAL: Use RESEARCHED camera specs - if specs say 3 cameras + 1 torch = show EXACTLY 3 cameras + 1 torch. COUNT CAREFULLY. Do NOT add extra cameras. RIGHT: Front screen. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Two phones. LEFT: EXACT empty case from reference (preserve ALL colors/patterns). RIGHT: Same case with phone inserted. CRITICAL: Camera count MUST MATCH researched specs EXACTLY. If specs say 2 cameras = show 2. If 3 cameras = show 3. Do NOT guess or add extra. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): EXACT empty case from reference image twisted in S-curve. Preserve ALL original colors, patterns, materials. NO phone inside. Text "Hybrid Design" at top. DO NOT change case design. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): Hand holding phone in EXACT case from reference (preserve ALL colors/patterns). CRITICAL: Camera configuration MUST MATCH researched specs EXACTLY. Count cameras carefully from specs. Phone body visible through transparent parts. Text "Flaunt The Original Look". Clean white studio background.',
  ],
  
  black: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle. LEFT: Front screen. RIGHT: EXACT case from reference (SAME colors, SAME design, SAME finish) with phone model inserted. CAMERAS: EXACT configuration from specs. DO NOT change case colors or appearance. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Phone back at 3/4 angle in EXACT case from reference. Preserve ALL original colors, patterns, finish. CAMERAS: EXACT count and position from specs. DO NOT alter case design. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): EXACT empty case from reference twisted in S-curve. Preserve ALL original colors, patterns, materials. NO phone inside. Text "Hybrid Design" at top. DO NOT modify case appearance. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): EXACT case from reference showing interior lining. Preserve case colors and materials. Text "Premium Velvet Interior". NO phone visible. DO NOT change case design. Clean white studio background.',
  ],
  
  transparent: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle. LEFT: Front screen. RIGHT: EXACT transparent case from reference (SAME transparency level, SAME tint, SAME materials) with phone model inserted showing phone body through case. CAMERAS: EXACT configuration from specs. DO NOT change case appearance. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Phone back at 3/4 angle in EXACT transparent case from reference. Preserve case transparency and finish. Phone design visible through case. CAMERAS: EXACT count and position from specs. DO NOT alter case. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): EXACT empty transparent case from reference twisted in S-curve. Preserve transparency, tint, all original characteristics. NO phone inside. Text "Hybrid Design" at top. DO NOT modify case appearance. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): Hand holding phone in EXACT transparent case from reference. Preserve case appearance. Phone body visible through case. CAMERAS: EXACT configuration from specs. Text "Flaunt The Original Look". DO NOT change case design. Clean white studio background.',
  ],
  
  matte: [
    'GRID 1 (Pure White Background): GENERATE A NEW REAL HUMAN HAND - DO NOT COPY THE HAND FROM REFERENCE IMAGE. Create a completely NEW photorealistic human hand and wrist (natural skin tone, living person, warm flesh, realistic fingers, NOT the plastic/mannequin hand from reference photo). This NEW human hand is holding phone with the EXACT SAME case from reference image. Case = copy from reference (same colors, design, materials, transparency). Hand = NEW and different from reference. Phone model inside case. Hand visible to wrist. Phone back showing. Clean white background. ',
    
    'GRID 2 (Pure White Background): EXACT empty case from reference image twisted in S-curve (HYBRID DESIGN style). Preserve ALL original colors, patterns, materials, transparency. NO phone inside. NO hand. Text "Hybrid Design" at top. DO NOT alter case appearance. Clean white studio background.',    
    
    'GRID 3 (Pure White Background): EXACT empty case from reference tilted on pedestal. Preserve ALL original colors, transparency, materials. NO phone inside. CRITICAL: NO black shadows, NO dark shadows, ONLY soft natural lighting. Pure white background with minimal shadow. DO NOT alter case appearance. Clean white studio background.',
    
    'GRID 4 (Pure White Background): EXACT empty case from reference image shown from back view only on a pedestal. Show ONLY the back view of the case displaying camera cutouts and design. Preserve ALL original colors, patterns, materials, transparency from reference. NO phone inside. NO hand. CRITICAL: NO black shadows, NO dark shadows, ONLY soft natural lighting with minimal shadow. Pure white background. Clean white studio background.',
  ],
};

export function getAngleDescriptions(caseType: string): string[] {
  return ANGLE_DESCRIPTIONS[caseType] || ANGLE_DESCRIPTIONS.transparent;
}

