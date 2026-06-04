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
- The phone's GENUINE real-world factory color and finish for THIS exact model, reproduced accurately as a SOLID, OPAQUE back panel of one definite color
- If multiple official colors exist, pick one real premium factory color and keep it consistent
- Reproduce the model's TRUE color exactly. Do NOT invent or substitute a different color, and do NOT add any pattern, print, weave, carbon-fiber look, or surface texture the real phone does not have. If the real phone is a neutral color (natural titanium, silver, midnight black, white), use that real neutral color; if it is a vivid color, use that real vivid color — but always the phone's actual color, never a guess from a color list
- The back must read as the real phone's solid, smooth, opaque panel in its true color. The only wrong look to avoid is a translucent see-through smoky-grey gradient with no solid color behind the glass — neutral real colors are not the problem, invented colors and invented textures are

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
- State that the phone seen through any clear/transparent case area is a SOLID, OPAQUE back panel in the phone's TRUE real color that fills the entire window, with the clear case acting only as colorless glass on top (it adds no tint of its own)
- State that the back must use the phone's real factory color and real smooth finish; explicitly forbid inventing colors, patterns, prints, weaves, carbon-fiber, or textures the real phone does not have
- Explicitly forbid rendering the back as a translucent see-through smoke gradient or as an empty clear panel showing only reflections — there must be a real solid opaque phone back behind the glass
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
  "phone_finish_description": "The model's GENUINE factory color reproduced accurately as a SOLID OPAQUE smooth back panel (e.g., natural titanium, midnight black, or whatever the real color actually is), with no invented pattern or texture and no translucent smoke-grey see-through gradient.",
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
    'PANEL 1 — PURE WHITE BACKGROUND (#FFFFFF). Two phones of the correct model shown LARGE as a premium Amazon hero product shot — together the two phones fill the frame and occupy at least 60% of the panel area, big and close-up, with only small even margins of white space around them. Never render them small inside a large empty white panel. Both phones are STANDING VERTICALLY UPRIGHT — their vertical axis is perfectly perpendicular to the ground, bottom edges flat on an invisible horizontal surface like products standing on a table. CRITICAL: the phones must be perfectly vertical and straight — do NOT tilt, lean, or slant them sideways, do NOT make them lean against each other, do NOT give a diagonal or falling look, do NOT float them in air. They stand straight up with zero lean from vertical, just like two phones placed standing on a desk. Only ROTATE each phone around its own vertical axis (a turn left/right, NOT a sideways tilt) to show different faces. LEFT phone: rotated ~20 degrees around its vertical axis so its BACK FACE is visible to the viewer — the exact doyers case from reference is fitted on, showing the case\'s bumper frame in its EXACT original color from the reference image (do NOT force the frame to black — reproduce the real frame color shown in the reference, whatever it is) around the edges and a CRYSTAL-CLEAR, COLORLESS, GLASS-LIKE center panel that is 100% optically transparent. The clear panel adds NO color of its own — NO grey shade, NO silver haze, NO smoke tint, NO frost, NO matte film, NO darkening overlay. Through this perfectly clear panel the phone\'s REAL ORIGINAL FACTORY BACK PANEL must show with its true authentic color and finish exactly as the actual phone looks in real life — reproduce the genuine real color of this specific model accurately (whatever it really is, neutral or vivid). Do NOT invent or substitute a different color, and do NOT add any pattern, weave, carbon-fiber look, or texture the real phone does not have. The only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass. Rear cameras and flash are correctly placed per researched specs. RIGHT phone: rotated ~20 degrees the other way so its FRONT SCREEN faces the viewer — shows the full display with correct Dynamic Island or punch-hole or notch, correct bezels, and a tasteful wallpaper (nature/gradient/abstract) — never blank white or solid black screen. The right phone stands slightly behind the left phone, overlapping it partially near the center, creating a layered dual-phone product composition as seen on Amazon.in. Both phones have a thin soft contact shadow right at their base where the bottom edge meets the white surface — this shadow proves they are grounded. No floating. No levitation. Clean overhead soft-box studio lighting. No logos, no phone model text anywhere.',

    'PANEL 2 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). Two items displayed side by side, both standing upright and grounded with bottom edges resting on a flat surface. LEFT: the exact empty doyers case from reference standing alone — its bumper frame in the EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference) and crystal-clear colorless center panel clearly visible, case geometry, camera cutout shape, corner radius, and material finish all exactly matching the reference image; the clear panel must not merge with the white background (add faint edge shadow or slight separation). RIGHT: the same exact case with the correct phone model fully inserted — the phone\'s REAL ORIGINAL FACTORY BACK PANEL must be fully visible through the CRYSTAL-CLEAR, COLORLESS center panel in its true authentic color and finish (whatever the genuine factory color of this model is). The clear panel is optically transparent like glass and adds NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening. Cameras correctly placed per researched specs. Soft drop shadow beneath each item. No logos or phone model text anywhere.',

    'PANEL 3 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). Single straight-on BACK VIEW of the correct phone model inserted fully into the exact doyers case from reference, displayed upright and centered. The case bumper frame, in its EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference), wraps the phone edges precisely. The center panel is CRYSTAL-CLEAR, COLORLESS, and 100% optically transparent like glass — it adds NO grey shade, NO silver haze, NO smoke tint, NO frost, NO matte film, NO darkening. Through it the phone\'s REAL ORIGINAL FACTORY BACK PANEL must show with its true authentic color and finish exactly as the actual phone looks in real life — reproduce the genuine real color of this specific model accurately (neutral or vivid, whatever it really is); do NOT invent or substitute a color and do NOT add any pattern, weave, or texture the real phone does not have. The only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass. Rear cameras and flash are correctly positioned and match researched specs exactly. Soft drop shadow below the phone confirms it is grounded on the surface. Preserve the case bumper color, geometry, and the perfectly clear transparency from the reference. Camera configuration must match researched specs. No logos or phone model text anywhere.',

    'PANEL 4 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). A hand holding the phone naturally and comfortably — the phone (correct model) is inside the exact doyers case from reference. The case bumper frame, in its EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference), is clearly visible on the edges. The center panel is CRYSTAL-CLEAR, COLORLESS, and 100% optically transparent like glass — NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening overlay. Through it the phone\'s REAL ORIGINAL FACTORY BACK PANEL shows with its true authentic color and finish exactly as the real phone looks (reproduce the genuine real color of this model accurately, neutral or vivid; do NOT invent or substitute a color and do NOT add any pattern, weave, or texture the real phone does not have; the only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass). Cameras and flash correctly placed per researched specs. The composition shows the back of the phone with the case, held at a natural product-photography angle. Add the text "Flaunt The Original Look" in clean minimal typography. No other logos, no phone model text, no brand names.',
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
