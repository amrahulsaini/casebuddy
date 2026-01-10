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
  return `You are analyzing for product photography.

STEP 1: Research "${phoneModel}" specifications
Look up the REAL specifications of "${phoneModel}" phone:
- Exact camera count on back (2, 3, 4, 5?)
- Torch/flash present? (yes/no)
- Camera arrangement (vertical, grid, L-shape, circular?)
- Camera island shape (rectangular, square, circular, pill?)
- Position on back (top-left, top-center?)

STEP 2: Analyze the case image
Look at the uploaded case:
- Material type (transparent center with black frame = doyers style)
- Camera cutout area visible
- How phone will fit inside

STEP 3: Describe how phone fits in case
Explain how the ${phoneModel}'s cameras will align with the case cutout when phone is inserted.

Return ONLY this JSON:

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
  "phone_model_description": "The ${phoneModel} has 3 cameras in vertical arrangement at top-left with torch below",
  "case_description": "Black frame doyers case with clear transparent center panel. Camera cutout in black frame at top-left",
  "final_generation_prompt": "Product photos of ${phoneModel}. This phone has 3 rear cameras arranged vertically with torch below. Black frame case with transparent center showing phone body and color through clear panel. Cameras fit precisely in frame cutout."
}

Be accurate. Research the model properly.`;
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
  'PANEL 1 (White Background): Two phones side-by-side at 3/4 angle. LEFT: Back view showing case - black frame edges with transparent center (phone body/color visible through center). Cameras in frame cutout match exact phone model specs. RIGHT: Front screen view showing model name. Both phones same angle, slight overlap, professional Amazon style.',
  
  'PANEL 2 (Dark Background): Two phones. LEFT: Empty case only (black frame + clear center with NO phone inside). RIGHT: Phone in case (black frame edges + phone visible through transparent center with exact camera configuration). Both at 3/4 angle, reflective surface.',
  
  'PANEL 3 (Light Background): ONE empty case twisted/curved in S-shape showing flexibility. Black frame edges + transparent center visible. NO phone inside. Text "Hybrid Design" at top with material labels. Clean minimal 3D render.',
  
  'PANEL 4 (Dark Background): Hand holding phone from back at angle. Black frame edges wrap around. Phone body/color/branding visible through transparent center. Cameras match exact model specs in frame cutout. Text "Flaunt The Original Look" at top. Lifestyle shot.',
];

