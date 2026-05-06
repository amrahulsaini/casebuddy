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
  return `You are preparing a master prompt for premium ecommerce phone-case mockups.

Context:
- The uploaded image is the seller's real physical case reference.
- Final images must show "${phoneModel}" fitted into this exact case.
- Main failure to avoid: the visible phone area turning into flat white or flat black.
- Main failure to avoid: a blank white front screen.

STEP 1: Determine "${phoneModel}" hardware and authentic appearance
- Rear camera count
- Torch / flash presence
- Camera arrangement
- Camera module position
- Front camera style (punch-hole, notch, bezel)
- One realistic factory body finish / hero color strongly associated with this model
- If multiple official colors exist, choose one premium realistic factory finish and keep it consistent
- Do not default to plain white or plain black unless that is genuinely the most recognizable factory finish

STEP 2: Analyze the uploaded case reference with precision
- Exact frame / bumper color
- Exact back panel color or transparency
- Transparency level, tint, frost, smokiness, or gloss
- Material finish and surface texture
- Camera cutout shape, outline color, and placement
- Side lip thickness, corner shape, and cutouts
- Whether the phone body should be clearly visible through transparent or open sections
- Any details needed so the clear area does not disappear into a bright background

CRITICAL:
- The case description will be used to recreate this product. Be exact about color, transparency, and finish.
- The visible phone body must stay realistic and must not be replaced with white fill, black fill, or an empty placeholder.

STEP 3: Create the generation prompt
Hard requirements for final_generation_prompt:
- State the exact camera count and camera layout for ${phoneModel}
- State the chosen authentic factory phone finish / body color and require it consistently in every panel
- State that any transparent or open case area must reveal the actual phone body beneath it
- Explicitly forbid flat white, flat black, blank filler, or paper-like insert areas inside the case
- State that any front-facing phone screen must show realistic front glass with a tasteful neutral abstract wallpaper or lockscreen gradient
- Explicitly forbid a blank white screen and a solid black screen
- State that the case colors, transparency, texture, and geometry must match the uploaded reference image exactly
- State that all panels must reuse one identical phone-and-case asset, changing only angle, crop, or hand pose
- State that backgrounds should be soft light neutral studio backgrounds that keep transparent materials readable
- Forbid logos, brand names, watermarks, and phone model text anywhere on the case or screen

Return strict JSON:

{
  "phone_model_camera_specs": {
    "model_name": "${phoneModel}",
    "rear_camera_count": 3,
    "has_torch_light": true,
    "camera_arrangement": "vertical",
    "camera_island_shape": "rectangular",
    "camera_module_position": "top-left",
    "front_camera_style": "center punch-hole",
    "lens_sizes": "main + ultrawide + macro"
  },
  "phone_model_description": "${phoneModel} has 3 rear cameras in a top-left rectangular module with flash.",
  "phone_finish_description": "Chosen authentic factory finish: graphite gray satin aluminum with matching dark glass back.",
  "screen_treatment": "Front display uses realistic dark glass with a subtle premium abstract gradient wallpaper, not plain white or solid black.",
  "case_description": "Detailed case description with exact frame color, transparent panel behavior, material finish, and camera cutout geometry.",
  "final_generation_prompt": "Exact prompt text that combines the phone specs, phone finish, case appearance, screen treatment, and hard constraints above."
}

Make case_description very detailed and color-accurate.`;
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
    'PANEL 1 (Soft pearl studio background, not harsh pure white): Two phones at 3/4 angle. LEFT: back view with the exact doyers case from reference fitted on the phone. The transparent center must reveal the authentic phone back finish beneath it. RIGHT: front view of the same phone with realistic front glass, correct punch-hole or notch, and a tasteful unbranded abstract wallpaper. Never show a blank white or solid black screen. Camera count and flash must match researched specs exactly. No logos or phone model text anywhere.',

    'PANEL 2 (Soft light neutral background): Two items. LEFT: exact empty case from reference, positioned so the clear center remains readable and does not disappear into the backdrop. Preserve all original colors, tint, and material finish. RIGHT: same case with phone inserted, showing the same authentic phone body color through the transparent area. Camera count must match researched specs exactly. No logos or phone model text anywhere.',

    'PANEL 3 (Clean light neutral studio background): Straight back view of the phone inserted into the exact case from reference. Preserve all original case colors, tint, transparency, and materials. The phone body visible through the clear center must keep the same authentic factory finish as panel 1, never generic white or black. Camera configuration must match researched specs exactly. No logos or phone model text anywhere.',

    'PANEL 4 (Premium soft neutral studio background): Hand holding the phone in the exact case from reference. Preserve all case colors, patterns, transparency, and materials. The phone body must remain visible through transparent parts in the same authentic factory finish used in every other panel. Camera configuration must match researched specs exactly. Add only the text "Flaunt The Original Look". No other logos or phone model text.',
  ],

  black: [
    'PANEL 1 (Clean light neutral studio background): Two phones at 3/4 angle. LEFT: front view with realistic front glass, correct bezel and punch-hole or notch, and a tasteful unbranded abstract wallpaper. Never show a blank white or solid black screen. RIGHT: exact case from reference with phone inserted. Cameras must match specs exactly. Do not change case colors or appearance.',

    'PANEL 2 (Clean light neutral studio background): Phone back at 3/4 angle in the exact case from reference. Preserve all original colors, patterns, and finish. Keep the same authentic factory phone finish across the visible phone body. Cameras must match specs exactly. Do not alter case design.',

    'PANEL 3 (Soft neutral background): Exact empty case from reference twisted in an S-curve. Preserve all original colors, patterns, and materials. No phone inside. Keep enough backdrop contrast so openings and edges remain clearly visible. Add text "Hybrid Design" at top. Do not modify case appearance.',

    'PANEL 4 (Soft neutral background): Exact case from reference showing interior lining. Preserve case colors and materials. Add text "Premium Velvet Interior". No phone visible. Do not change case design.',
  ],

  transparent: [
    'PANEL 1 (Soft pearl studio background, not harsh pure white): Two phones at 3/4 angle. LEFT: front view with realistic glass, correct bezel and punch-hole or notch, and a tasteful unbranded abstract wallpaper. Never blank white or solid black. RIGHT: exact transparent case from reference with phone inserted, clearly showing the authentic phone body finish through the case. Cameras must match specs exactly. Do not change case appearance.',

    'PANEL 2 (Soft light neutral background): Phone back at 3/4 angle in the exact transparent case from reference. Preserve case transparency, tint, and finish. The phone body visible through the case must keep the same authentic factory finish and must never become plain white or plain black. Cameras must match specs exactly. Do not alter the case.',

    'PANEL 3 (Soft pearl or light gray background): Exact empty transparent case from reference twisted in an S-curve. Preserve transparency, tint, and all original characteristics. No phone inside. Keep the backdrop soft but visible enough that the transparent case does not disappear. Add text "Hybrid Design" at top. Do not modify case appearance.',

    'PANEL 4 (Premium soft neutral studio background): Hand holding phone in the exact transparent case from reference. Preserve case appearance. The phone body must remain visible through the case in the same authentic factory finish used in the other panels. Cameras must match specs exactly. Add text "Flaunt The Original Look". Do not change case design.',
  ],

  matte: [
    'PANEL 1 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image at tilted 45-degree angle. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',

    'PANEL 2 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image, back view showing camera cutouts. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',
  ],
};

export function getAngleDescriptions(caseType: string): string[] {
  return ANGLE_DESCRIPTIONS[caseType] || ANGLE_DESCRIPTIONS.transparent;
}
