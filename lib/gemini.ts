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
  return `You are analyzing a phone case image for "${phoneModel}".

TASK: Research the ${phoneModel} phone and describe what you find.

STEP 1: Look up "${phoneModel}" specs:
- How many cameras on the back?
- Is there a flash/torch?
- What arrangement (vertical, grid, L-shape)?
- Where is the camera module (top-left, center, etc.)?

STEP 2: Look at the case image:
- What material? (clear/transparent, black frame with clear center, solid black, etc.)
- What can you see?

Return ONLY this JSON (no markdown, no extra text):

{
  "phone_model_camera_specs": {
    "model_name": "${phoneModel}",
    "rear_camera_count": 3,
    "has_torch_light": true,
    "camera_arrangement": "vertical triple camera",
    "camera_island_shape": "rectangular",
    "camera_module_position": "top-left corner",
    "lens_sizes": "50MP main, 8MP ultrawide, 2MP macro"
  },
  "phone_model_description": "The ${phoneModel} has 3 rear cameras arranged vertically...",
  "case_description": "Transparent case with black frame (doyers style)...",
  "final_generation_prompt": "Create product photos of ${phoneModel} with exactly 3 cameras arranged vertically in the case shown..."
}

IMPORTANT: The final_generation_prompt should start with: "Create a 4-panel product grid for ${phoneModel}. This phone has [X] cameras arranged [pattern] with [torch if present]. The case is [describe case type]."

Keep it simple and accurate.`;
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
  'PANEL 1 - AMAZON HERO SHOT (FIXED ANGLE): TWO smartphones positioned side-by-side with SLIGHT OVERLAP on CLEAN WHITE BACKGROUND. MANDATORY ANGLE: Both phones MUST be shown at EXACTLY 3/4 ANGLED VIEW (approximately 15-20 degree tilt from straight-on) - this is NON-NEGOTIABLE and must be EXACTLY like the reference product image style. DO NOT show flat front view, DO NOT show top-down view, DO NOT show side profile - ONLY 3/4 angled view showing depth and dimension. LEFT PHONE: Shows BACK VIEW with case at this EXACT 3/4 angle - For DOYERS cases: BLACK FRAME/BUMPER clearly wrapping all edges with sharp definition, TRANSPARENT CENTER PANEL showing actual phone color/body and branding (like "vivo" logo visible through clear center). CRITICAL CAMERA ACCURACY: The camera module cutout in the BLACK FRAME must EXACTLY match the specified phone model\'s precise camera configuration - analyze the phone model name provided (e.g., "Vivo V60 5G", "Galaxy A35 5G") and render the EXACT number of camera lenses, their EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes (main/ultra-wide/macro/depth), and EXACT spacing as that specific phone model has in reality. DO NOT use generic camera layouts. Research and replicate the actual camera island shape and lens configuration of the named phone model. The camera cutout must be a precise match to that model\'s specifications. RIGHT PHONE: Shows FRONT DISPLAY/SCREEN at MATCHING IDENTICAL 3/4 angle with screen facing viewer, displaying phone model compatibility text clearly readable. CRITICAL: Both phones MUST maintain this EXACT SAME 3/4 TILT ANGLE (15-20 degrees) - they should look like professional product photography with consistent perspective. Phones slightly overlapping at edges, CENTERED in frame, standing upright. Professional Amazon-style e-commerce studio lighting with soft shadows beneath phones. Clean white background with subtle gradient. This is the main Amazon product hero image showing complete 360° view - case design on left, screen functionality on right. For DOYERS cases: Show strong contrast between matte black protective frame edges and crystal-clear transparent center where phone body is visible. The black frame should have sharp, clean boundaries. TRANSPARENT cases: Show full phone visibility through clear material. BLACK cases: Show solid black protective coverage. Material accuracy and phone-specific camera precision are MANDATORY. Clean, minimal, professional product photography. REMEMBER: This angle NEVER changes - ALWAYS 3/4 tilted view showing dimension and depth, exactly like the reference style.',
  'PANEL 2 - DUAL PHONE COMPARISON: TWO phones side-by-side on DARK/BLACK BACKGROUND with dramatic studio lighting. LEFT PHONE: Shows ONLY THE CASE without phone inside - pure BLACK FRAME/BUMPER with crystal clear/transparent center appearing EMPTY like glass, showing the case protection element by itself without any phone visible through it. The transparent center should look like clear glass/crystal with no phone backing visible. Camera cutout in the black frame visible but empty. RIGHT PHONE: Shows case WITH ACTUAL PHONE INSIDE - BLACK FRAME wrapping edges but TRANSPARENT CENTER clearly reveals the actual phone color/body (like cream, gold, black, blue etc.), phone branding and design fully visible through clear material. CRITICAL CAMERA ACCURACY: Camera modules visible with cutouts EXACTLY matching the specified phone model\'s precise camera configuration - analyze the phone model name and render the EXACT number of lenses, EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes, and EXACT spacing as that specific model has. DO NOT use generic layouts. Both phones show BACK VIEW at MATCHING 3/4 ANGLE (approximately 25-30 degrees) - PERFECTLY ALIGNED at identical angles and heights. Both positioned upright standing on reflective dark surface at same level. Gradient lighting from behind creates depth and premium feel. Professional product comparison demonstrating: left = case transparency/clarity alone, right = how real phone looks through case. Realistic shadows and reflections. Symmetrical elegant spacing with both phones at identical tilt angles.',
  'PANEL 3 - HYBRID DESIGN 3D RENDER: JUST ONE SINGLE phone case (the EXACT uploaded case design reference) displayed in DRAMATIC CURVED/BENT/TWISTED POSITION floating in 3D space on CLEAN LIGHT BACKGROUND (white to light grey gradient). ONE CASE ONLY - not two phones, not multiple cases - JUST THE SINGLE CASE SHELL. For DOYERS cases: Show the BLACK FRAME/BUMPER and TRANSPARENT CENTER clearly - the actual case structure with black protective edges and clear center panel. The EMPTY CASE is SIGNIFICANTLY CURVED and BENT like a wave or S-curve showcasing FLEXIBILITY and three-dimensional form. NO PHONE INSIDE, NO CAMERA CUTOUTS VISIBLE - just the pure case structure itself twisted/bending through space demonstrating the flexible hybrid construction. The case appears to float and bend showing the material flexibility of soft edges and rigid back panel. Large clean text "Hybrid Design" positioned separately at TOP of image (NOT on the case itself) in modern bold font. Simple annotation labels positioned SEPARATELY with minimal dotted lines or tick marks: "Soft TPU edge" pointing to black frame area, "Tough PC backplane" pointing to transparent center area. NO decorative elements, NO circular spheres, NO bubbles, NO camera details - just clean minimal design focusing on the single twisted/curved empty case shell demonstrating flexibility. Soft shadows beneath the curved case. The case should appear dramatically bent/curved in S-curve or wave position showing material flexibility. Professional 3D product render style. Clean, simple, minimalist background. EMPHASIS: ONLY ONE SINGLE EMPTY CASE SHELL in twisted form - exactly as provided in reference, no modifications.',
  'PANEL 4 - LIFESTYLE HAND SHOT: Professional lifestyle photography showing a natural hand holding the phone from the BACK VIEW at slight angle (approximately 20-25 degrees) on DARK/BLACK GRADIENT BACKGROUND. Hand positioned on right side naturally gripping the phone, fingers visible on sides and bottom edge. Phone ALIGNED at consistent angle showing depth and dimension. For DOYERS cases: BLACK FRAME/BUMPER clearly visible wrapping around edges with sharp definition. TRANSPARENT CENTER prominently displaying the actual phone color, design, and branding through crystal-clear material - emphasizing how the case lets you "Flaunt The Original Look". CRITICAL CAMERA ACCURACY: Camera module sharply in focus with cutouts in the black frame precisely matching the specified phone model\'s EXACT camera configuration - analyze the phone model name and render the EXACT number of camera lenses, their EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes (main/ultra-wide/macro/depth sensors), and EXACT spacing as that specific phone model has in reality. DO NOT use generic camera layouts. The camera cutout must be a precise match to that model\'s specifications. Studio lighting creates subtle highlights on the transparent center and dramatic shadows on dark background. Natural, realistic hand with proper skin tones and lighting. Title text "Flaunt The Original Look" positioned in top-left area. The shot should emphasize how the Doyers case protects while showcasing the phone\'s original beauty and design through the transparent center. Professional, aspirational lifestyle photography suitable for premium product marketing.',
];

