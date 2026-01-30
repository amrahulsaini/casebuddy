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
  "final_generation_prompt": "⚠️ ${phoneModel} CAMERA COUNT ⚠️\\n2 CAMERAS ONLY (not 3, not 4, ONLY TWO)\\n1 TORCH\\nTOTAL: 3 circles\\nVertical line, top-left\\n\\n⚠️ RENDER EXACTLY 2 CAMERA CIRCLES + 1 TORCH CIRCLE = 3 TOTAL ⚠️\\n\\nCase: Use exact design from reference image.\\n4K product photos, professional lighting."
}

Make final_generation_prompt SHORT and START with camera count using emojis and caps.`;
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
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle. LEFT: Back view - EXACT case from reference with phone inside. CAMERAS: Render ONLY the exact number and arrangement specified in camera specs. RIGHT: Front screen with model name. Professional Amazon style. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Two phones. LEFT: Empty case. RIGHT: Phone in case. CAMERAS: Use EXACT count and position from specs. Both at 3/4 angle. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): ONE empty case twisted in S-curve. NO phone. Text "Hybrid Design" at top. Match reference case design exactly. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): Hand holding phone in case from back. CAMERAS: Show EXACT camera configuration from specs. Phone body visible through transparent parts. Text "Flaunt The Original Look". Clean white studio background.',
  ],
  
  black: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle showing opposite sides. LEFT: Front screen view with model name. RIGHT: Back view with EXACT case design and EXACT camera configuration from specs. Professional Amazon style. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Phone back side view at 3/4 angle. Show EXACT case design with EXACT camera count and position from specs. Professional lighting. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): EMPTY case ONLY twisted in S-curve. NO phone inside. Show the EXACT case design from reference image (colors, patterns, materials) in flexible twisted form. Text "Hybrid Design" at top. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): Inner velvet design of case. Show interior lining texture and soft velvet material. Text "Premium Velvet Interior". NO phone visible, just case interior. Clean white studio background.',
  ],
  
  transparent: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle showing opposite sides. LEFT: Front screen view with model name. RIGHT: Back view with transparent case showing phone body through case. CAMERAS: EXACT configuration from specs. Clean white studio background.',
    
    'PANEL 2 (Pure White Background): Phone back side view at 3/4 angle. Transparent case showing original phone design visible through it. CAMERAS: EXACT count and position from specs. Clean white studio background.',
    
    'PANEL 3 (Pure White Background): EMPTY transparent case ONLY twisted in S-curve. NO phone inside. Show the EXACT transparent case from reference image in flexible twisted form. Text "Hybrid Design" at top. Clean white studio background.',
    
    'PANEL 4 (Pure White Background): Hand holding phone in transparent case. Show back view with phone body visible through case. CAMERAS: EXACT configuration from specs. Text "Flaunt The Original Look". Clean white studio background.',
  ],
  
  matte: [
    'PANEL 1 (Pure White Background): Two phones at 3/4 angle showing opposite sides. LEFT: Front screen view with model name. RIGHT: Back view with GREY MATTE case. CAMERAS: EXACT configuration from specs. Clean white studio background, professional Amazon style.',
    
    'PANEL 2 (Pure White Background): Phone back side view at 3/4 angle. GREY MATTE case with premium matte finish texture. CAMERAS: EXACT count and position from specs. Soft shadows on white background.',
    
    'PANEL 3 (Pure White Background): GREY MATTE case only, no phone. Bent in S-curve to show flexibility. Text "Soft Matte Finish" at top. Show texture and premium feel. Clean white background.',
    
    'PANEL 4 (Pure White Background): Hand holding phone in GREY MATTE case from back angle. Camera island with RAISED LENS PROTECTOR RING clearly visible around each camera lens. CAMERAS: EXACT configuration from specs. Text "WITH LENS PROTECTOR" with arrow pointing to raised ring. Show camera protection feature prominently.',
  ],
};

export function getAngleDescriptions(caseType: string): string[] {
  return ANGLE_DESCRIPTIONS[caseType] || ANGLE_DESCRIPTIONS.transparent;
}

