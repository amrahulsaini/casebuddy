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

STEP 2: Analyze the ACTUAL case in the uploaded image
- What does THIS SPECIFIC case look like?
- Material/color (black frame with clear center, fully clear, solid black?)
- Camera cutout shape and position
- Any design patterns or branding on the case

STEP 3: Describe insertion
- How will ${phoneModel} look when inserted into THIS EXACT case from the image
- Where cameras align with case cutout
- What parts of phone are visible

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
  "case_description": "Describe the EXACT case from uploaded image - colors, patterns, material, cutouts",
  "final_generation_prompt": "⚠️ ${phoneModel} CAMERA COUNT ⚠️\n2 CAMERAS ONLY (not 3, not 4, ONLY TWO)\n1 TORCH\nTOTAL: 3 circles\nVertical line, top-left\n\n⚠️ RENDER EXACTLY 2 CAMERA CIRCLES + 1 TORCH CIRCLE = 3 TOTAL ⚠️\n\nCase: Use exact design from reference image.\n4K product photos, professional lighting."
}

Make final_generation_prompt SHORT and START with camera count using emojis and caps.`;
}
- Be extremely explicit and use numbers written as words AND digits`;
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

export const ANGLE_DESCRIPTIONS = [
  'PANEL 1 (White Background): Two phones at 3/4 angle. LEFT: Back view - EXACT case from reference with phone inside. CAMERAS: Render ONLY the exact number and arrangement specified in camera specs (e.g., if 2 cameras + torch, show EXACTLY 2 cameras + torch, NOT 3 or 4). RIGHT: Front screen with model name. Professional Amazon style.',
  
  'PANEL 2 (Dark Background): Two phones. LEFT: Empty case. RIGHT: Phone in case. CAMERAS: Use EXACT count and position from specs (if specs say 2 cameras vertical, show EXACTLY 2 cameras vertical, NOT random layout). Both at 3/4 angle.',
  
  'PANEL 3 (Light Background): ONE empty case twisted in S-curve. NO phone. Text "Hybrid Design" at top. Match reference case design exactly.',
  
  'PANEL 4 (Dark Background): Hand holding phone in case from back. CAMERAS: Show EXACT camera configuration from specs (count, position, arrangement must match exactly as specified). Phone body visible through transparent parts. Text "Flaunt The Original Look".',
];

