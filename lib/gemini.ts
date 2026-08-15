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

// Clear-window case types. Everything else (black, matte, printed…) is opaque
// and must be analysed by COPYING the case's real colour and material.
const CLEAR_CASE_TYPES = new Set(['transparent', 'doyers', 'bulk_doyers']);

export function isClearCaseType(caseType: string): boolean {
  return CLEAR_CASE_TYPES.has(caseType);
}

export function buildAnalysisPrompt(phoneModel: string, caseType: string = 'transparent'): string {
  // Opaque cases: the clear-case analysis below tells the model the case is
  // "colorless water-clear plastic", which made black cases come out
  // see-through. They get their own analysis that reads colour from the photo.
  if (!isClearCaseType(caseType)) {
    return buildOpaqueAnalysisPrompt(phoneModel);
  }
  return `You are preparing a master prompt for premium ecommerce phone-case mockups.

Context:
- The uploaded image is the seller's real physical case reference.
- IMPORTANT — HOW TO READ IT: it is a casual snapshot of the case HELD IN A HAND against a plain grey/white wall. The hand, palm, fingers, skin tone, and the wall are visible THROUGH the clear plastic. They are NOT part of the case. The case is colorless, water-clear plastic. Never describe the skin tone, the beige/brown/grey shading, or the diagonal light-to-dark boundary where the hand ends as if it were the case's own tint, frost, smoke, or gradient — that is just the hand behind clear plastic.
- Final images must show "${phoneModel}" fitted into this exact case.
- Main failure to avoid: the visible phone area turning into flat white or flat black.
- Main failure to avoid: a blank white front screen.
- Main failure to avoid: describing the case as tinted/smoky/shaded because a hand was behind it in the photo.

STEP 1: Determine "${phoneModel}" hardware and authentic appearance
- Rear camera count
- Torch / flash presence
- Camera arrangement
- Camera module position
- Front camera style (punch-hole, notch, bezel)
- A REAL factory color for THIS exact model, reproduced as a SOLID, OPAQUE back panel of one definite color
- COLOR CHOICE RULE (IMPORTANT): Almost every model ships in several official colors. From that model's REAL official color options, choose a RICH, SATURATED, ATTRACTIVE one — for example deep green, deep blue, purple, teal, or a true deep black. NEVER choose white, silver, light grey, titanium, graphite, gunmetal, beige, or any pale/washed-out neutral, even if such a color exists for the model: those look washed out through a clear case and are not wanted. If the model genuinely only ships in pale neutrals, use a deep black instead.
- Do NOT add any pattern, print, weave, carbon-fiber look, or surface texture the real phone does not have. The back is one smooth, solid, evenly-coloured panel.
- The back must read as a solid, smooth, opaque panel in one vivid color. Avoid a translucent see-through smoky-grey gradient with no solid color behind the glass.

STEP 2: Analyze the uploaded case reference — GEOMETRY ONLY
Describe ONLY physical shape facts, ignoring the hand and the wall behind the case:
- Camera cutout shape, size, and placement, and the raised camera-protection lip around it
- The four REINFORCED AIR-CUSHION CORNER PADS: note that each corner has a thicker raised pad of clear plastic (often with a subtle internal rib/hatch pattern) projecting slightly beyond the slim side walls. Always report these as present and describe their modest size — they must be reproduced, never omitted, and never exaggerated into rugged-armor blocks.
- Side lip thickness, button cutouts, and port cutout
- Outer silhouette and proportions

CRITICAL:
- The case is colorless, water-clear TPU. Do NOT report any tint, frost, smoke, gradient, shading, or color for it — anything like that in the photo is the hand or the room behind the clear plastic.
- Do not mention the hand, fingers, skin, or the background anywhere in your output.
- The visible phone body must stay realistic and must not be replaced with white fill, black fill, or an empty placeholder.

STEP 3: Create the generation prompt
Hard requirements for final_generation_prompt:
- State the exact camera count and camera layout for ${phoneModel}
- State the chosen RICH SATURATED factory phone color (never white/silver/grey/titanium/graphite) and require it consistently in every panel
- State that any transparent or open case area must reveal the actual phone body beneath it
- State that the phone seen through any clear/transparent case area is a SOLID, OPAQUE back panel in the phone's TRUE real color that fills the entire window, with the clear case acting only as colorless glass on top (it adds no tint of its own)
- State that the back must use the phone's real factory color and real smooth finish; explicitly forbid inventing colors, patterns, prints, weaves, carbon-fiber, or textures the real phone does not have
- Explicitly forbid rendering the back as a translucent see-through smoke gradient or as an empty clear panel showing only reflections — there must be a real solid opaque phone back behind the glass
- Explicitly forbid flat white, flat black, blank filler, or paper-like insert areas inside the case
- State that any front-facing phone screen must show realistic front glass with a tasteful neutral abstract wallpaper or lockscreen gradient
- Explicitly forbid a blank white screen and a solid black screen
- State that the case GEOMETRY (silhouette, cutouts, camera lip, lip thickness) must match the uploaded reference exactly, and that the case itself is colorless water-clear plastic with no tint, frost, smoke, or shading of its own
- State that the four reinforced air-cushion corner pads must be reproduced on every panel at the reference's modest size — never omitted, flattened, or exaggerated
- State that the hand, skin tone, and grey backdrop seen through the clear plastic in the reference photo must be ignored entirely and never reproduced as case tint or shading
- State that all panels must reuse one identical phone-and-case asset, changing only angle, crop, or hand pose
- State that backgrounds should be pure white (#FFFFFF) studio backgrounds with no cream, beige, or warm tint, while still keeping transparent materials readable
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
  "phone_finish_description": "A rich saturated REAL factory color for this model reproduced as a SOLID OPAQUE smooth back panel (e.g., deep forest green, deep blue, purple, or true deep black — never white, silver, grey, titanium, or graphite), with no invented pattern or texture and no translucent smoke-grey see-through gradient.",
  "screen_treatment": "Front display uses realistic dark glass with a subtle premium abstract gradient wallpaper, not plain white or solid black.",
  "case_description": "Detailed case description with exact frame color, transparent panel behavior, material finish, and camera cutout geometry.",
  "final_generation_prompt": "Exact prompt text that combines the phone specs, phone finish, case appearance, screen treatment, and hard constraints above."
}

Make case_description very detailed and color-accurate.`;
}

// Analysis for OPAQUE cases (black, matte, printed). The case has its own real
// colour, material, and artwork, and all of it is copied from the reference —
// the opposite of the clear-case analysis above.
function buildOpaqueAnalysisPrompt(phoneModel: string): string {
  return `You are preparing a master prompt for premium ecommerce phone-case mockups.

Context:
- The uploaded image is the seller's real physical case reference.
- HOW TO READ IT: it may be a casual snapshot, possibly held in a hand against a plain wall. Ignore the hand, fingers, skin, and the wall — they are not part of the product. Everything else you see IS the case.
- THIS CASE IS OPAQUE. It is NOT transparent, NOT clear, NOT see-through, and NOT water-clear plastic. It has its own solid colour, material, and finish, and the phone inside it is completely hidden by the case except where the case has a real physical opening (camera cutout, button cutouts, port cutout, screen side).
- Final images must show "${phoneModel}" fitted into this exact case.
- Main failure to avoid: describing or rendering this opaque case as transparent, clear, tinted, or showing the phone body through its back.

STEP 1: Determine "${phoneModel}" hardware and authentic appearance
- Rear camera count
- Torch / flash presence
- Camera arrangement
- Camera module position
- Front camera style (punch-hole, notch, bezel)
- Note: the phone's own body colour is mostly IRRELEVANT here, because the opaque case covers the back. Only the parts visible through the camera cutout and around the edges matter.

STEP 2: Analyze the uploaded case reference — COLOR, MATERIAL AND GEOMETRY
Describe the case exactly as photographed:
- Its exact colour (and every colour, if multi-tone), reported faithfully — if it is black, say black
- Its material and surface finish: matte, glossy, soft-touch, rubberised, frosted, leather, silicone, hard polycarbonate, metallic, etc.
- Any print, artwork, pattern, texture, embossing, or two-tone split, and exactly where it sits
- Camera cutout shape, size, and placement, and the raised camera-protection lip around it
- Corner shape and thickness, side lip thickness, button cutouts, and port cutout
- Outer silhouette and proportions
- Any interior lining or contrasting inner colour visible in the photo

CRITICAL:
- Report the case's REAL colour and material from the photo. Never call it colorless, clear, transparent, or untinted unless the case genuinely has a transparent section, and then say precisely which section.
- Do not mention the hand, fingers, skin, or the background anywhere in your output.
- The case's back covers the phone completely: do NOT describe the phone's back panel as visible through it.

STEP 3: Create the generation prompt
Hard requirements for final_generation_prompt:
- State the exact camera count and camera layout for ${phoneModel}
- State the case's exact colour, material, finish, and any artwork, and require them reproduced identically in every panel
- State explicitly that the case is OPAQUE and that the phone's back is NOT visible through it
- State that the case colour, artwork, geometry, cutouts, camera lip, and lip thickness must match the uploaded reference exactly
- State that any front-facing phone screen must show realistic front glass with a tasteful neutral abstract wallpaper or lockscreen gradient
- Explicitly forbid a blank white screen and a solid black screen
- State that all panels must reuse one identical phone-and-case asset, changing only angle, crop, or hand pose
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
  "phone_finish_description": "Not visible — the opaque case covers the phone's back panel entirely.",
  "screen_treatment": "Front display uses realistic dark glass with a subtle premium abstract gradient wallpaper, not plain white or solid black.",
  "case_description": "Detailed case description with exact colour, material, finish, artwork, and camera cutout geometry, copied faithfully from the reference.",
  "final_generation_prompt": "Exact prompt text that combines the phone specs, the opaque case appearance, screen treatment, and hard constraints above."
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
    'PANEL 1 — PURE WHITE BACKGROUND (#FFFFFF). Two phones of the correct model shown LARGE as a premium Amazon hero product shot — together the two phones fill the frame and occupy at least 60% of the panel area, big and close-up, with only small even margins of white space around them. Never render them small inside a large empty white panel. Both phones are STANDING VERTICALLY UPRIGHT — their vertical axis is perfectly perpendicular to the ground, bottom edges flat on an invisible horizontal surface like products standing on a table. CRITICAL: the phones must be perfectly vertical and straight — do NOT tilt, lean, or slant them sideways, do NOT make them lean against each other, do NOT give a diagonal or falling look, do NOT float them in air. They stand straight up with zero lean from vertical, just like two phones placed standing on a desk. Only ROTATE each phone around its own vertical axis (a turn left/right, NOT a sideways tilt) to show different faces. LEFT phone: rotated ~20 degrees around its vertical axis so its BACK FACE is visible to the viewer — the exact doyers case from reference is fitted on, showing the case\'s bumper frame in its EXACT original color from the reference image (do NOT force the frame to black — reproduce the real frame color shown in the reference, whatever it is) around the edges and a CRYSTAL-CLEAR, COLORLESS, GLASS-LIKE center panel that is 100% optically transparent. The clear panel adds NO color of its own — NO grey shade, NO silver haze, NO smoke tint, NO frost, NO matte film, NO darkening overlay. Through this perfectly clear panel the phone\'s REAL ORIGINAL FACTORY BACK PANEL must show with its true authentic color and finish exactly as the actual phone looks in real life — reproduce the genuine real color of this specific model accurately (whatever it really is, neutral or vivid). Do NOT invent or substitute a different color, and do NOT add any pattern, weave, carbon-fiber look, or texture the real phone does not have. The only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass. Rear cameras and flash are correctly placed per researched specs. RIGHT phone: rotated ~20 degrees the other way so its FRONT SCREEN faces the viewer — shows the full display with correct Dynamic Island or punch-hole or notch, correct bezels, and a tasteful wallpaper (nature/gradient/abstract) — never blank white or solid black screen. The right phone stands well behind the left phone and is MOSTLY HIDDEN by it — the left phone overlaps and covers the majority of the right phone, so only a narrow vertical sliver of the right phone\'s right side peeks out from behind the left phone (just enough to reveal a second phone showing its front screen). This is heavy overlap, NOT a side-by-side layout — the back-view left phone is clearly the main product and the front-screen right phone is largely tucked behind it. This creates a layered dual-phone product composition as seen on Amazon.in. Both phones have a thin soft contact shadow right at their base where the bottom edge meets the white surface — this shadow proves they are grounded. No floating. No levitation. Flat, even, on-axis frontal lighting with no angled highlight or diagonal reflection streak. No logos, no phone model text anywhere.',

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
    'PANEL 1 (Pure white background, no cream or beige tint) — this is ONE single cell containing both phones together as a single photo, do NOT split into separate cells: TWO phones standing perfectly STRAIGHT and upright, facing the camera head-on (no tilt, no 3/4 angle, no leaning), photographed straight-on at eye level. The FRONT phone is centered and fully visible and shows its BACK inside the exact transparent case from reference, revealing the authentic phone body finish through the clear case with cameras matching specs exactly. There is EXACTLY ONE other phone, placed BEHIND it and shifted LEFT, showing its FRONT screen. The two overlap VERY HEAVILY: the front phone hides about three quarters of it. The two phones must NOT sit side by side, must NOT each take half the frame, must NOT be separated by a gap, and the back phone must NOT be half visible — it is mostly buried behind the front phone, showing just a thin strip of its screen edge. The RIGHT side of the front phone has NOTHING behind it: just clean empty white background, no second phone. The visible screen shows realistic front glass, correct bezel and punch-hole or notch, and a tasteful unbranded abstract wallpaper, never blank white or solid black. Both phones share the same scale, lighting, and floor. Do not change case appearance. The phone body seen through the clear case must look like a REAL phone, NOT painted: reproduce this exact model\'s authentic factory back colour and material, but render it with a soft even MATTE finish under flat head-on studio light so the colour reads uniform across the whole back. Choose ONE of the model\'s real attractive launch colours (avoid plain white or silver). CRITICAL — NO STREAKS: there must be NO diagonal light streak, NO slanted bright band, NO crossing X-shaped glare, NO mirror reflection, and NO light-to-dark gradient anywhere on the back; the surface stays ONE clean even shade of its real colour edge to edge. It must read as a real phone back, never flat poster paint and never a glossy diagonal streak.',

    'PANEL 2 (Pure white background, no cream or beige tint): The exact EMPTY transparent case from reference, standing upright and shown from its BACK side only, with NO phone inside it — just the bare clear case shell by itself, exactly the same case as in Panel 1, and no hands. Preserve the case shape, camera cutout, and the raised camera-protection lip exactly. The whole case must be fully visible from top to bottom, centered in the panel, nothing cropped. Do not insert any phone and do not alter the case.',
  ],

  // Doyers for the BULK tool: the physical case has an opaque coloured bumper
  // frame (black in the reference) with a fully clear back window. Panels 1-2
  // are the transparent tool's two angles; panels 3-4 are the doyers tool's
  // panels 2 and 4, with the "Flaunt The Original Look" text removed.
  bulk_doyers: [
    'PANEL 1 (Pure white background, no cream or beige tint) — this is ONE single cell containing both phones together as a single photo, do NOT split into separate cells: TWO phones standing perfectly STRAIGHT and upright, facing the camera head-on (no tilt, no 3/4 angle, no leaning), photographed straight-on at eye level. The FRONT phone is centered and fully visible and shows its BACK inside the exact doyers case from reference — the case\'s opaque bumper frame in its EXACT original colour from the reference image wraps the edges, and the phone\'s real body finish shows through the crystal-clear colourless back window, and the phone\'s lenses visible THROUGH the case\'s punched camera holes — the case\'s opaque camera plate stays on top with the reference\'s exact hole count and layout, never replaced by the phone\'s own camera island. There is EXACTLY ONE other phone, placed BEHIND it and shifted LEFT, showing its FRONT screen. The two overlap VERY HEAVILY: the front phone hides about three quarters of it. The two phones must NOT sit side by side, must NOT each take half the frame, must NOT be separated by a gap, and the back phone must NOT be half visible — it is mostly buried behind the front phone, showing just a thin strip of its screen edge. The RIGHT side of the front phone has NOTHING behind it: just clean empty white background, no second phone. The visible screen shows realistic front glass, correct bezel and punch-hole or notch, and a tasteful unbranded abstract wallpaper, never blank white or solid black. Both phones share the same scale, lighting, and floor. Do not change case appearance. The phone body seen through the clear window must look like a REAL phone, NOT painted: reproduce this exact model\'s authentic factory back colour and material, but render it with a soft even MATTE finish under flat head-on studio light so the colour reads uniform across the whole back. Choose ONE of the model\'s real attractive launch colours (avoid plain white or silver). CRITICAL — NO STREAKS: there must be NO diagonal light streak, NO slanted bright band, NO crossing X-shaped glare, NO mirror reflection, and NO light-to-dark gradient anywhere on the back; the surface stays ONE clean even shade of its real colour edge to edge. It must read as a real phone back, never flat poster paint and never a glossy diagonal streak.',

    'PANEL 2 (Pure white background, no cream or beige tint): The exact EMPTY doyers case from reference, standing upright and shown from its BACK side only, with NO phone inside it — just the bare case shell by itself, exactly the same case as in Panel 1, and no hands. Its bumper frame keeps the EXACT original colour from the reference image, and the back window is empty clear plastic so the pure white background shows straight through it unchanged. Preserve the case shape, camera cutout, and the raised camera-protection lip exactly. The whole case must be fully visible from top to bottom, centered in the panel, nothing cropped. Do not insert any phone and do not alter the case.',

    'PANEL 3 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). Two items displayed side by side, both standing upright and grounded with bottom edges resting on a flat surface. LEFT: the exact empty doyers case from reference standing alone — its bumper frame in the EXACT original colour from the reference image (do NOT force black — use the real frame colour shown in the reference) and crystal-clear colourless centre window clearly visible, case geometry, camera cutout shape, corner radius, and material finish all exactly matching the reference image; the clear window must not merge with the white background (add faint edge shadow or slight separation). RIGHT: the same exact case with the correct phone model fully inserted so the phone sits snugly inside the bumper frame — the phone\'s REAL ORIGINAL FACTORY BACK PANEL must be fully visible through the CRYSTAL-CLEAR, COLOURLESS centre window in its true authentic colour and finish. The clear window is optically transparent like glass and adds NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening. The case\'s raised camera plate keeps the reference\'s exact hole count, arrangement and size on BOTH items, and on the right-hand one the phone\'s lenses sit centred inside those holes rather than replacing the plate. Soft drop shadow beneath each item. No logos, no brand names, and no text of any kind anywhere.',

    'PANEL 4 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). A young WOMAN\'S hand holding the phone naturally and comfortably — a slim, elegant, well-groomed feminine hand with slender fingers, smooth clear skin, and short neat natural nails (bare or a subtle nude manicure), no rings, no bracelet, no watch, no nail art, no tattoos, no visible arm hair. Generate this hand fresh — do NOT copy, trace, or reuse the hand in the uploaded reference photo. The reference is a man\'s hand that merely holds the case for the snapshot: ignore its shape, size, knuckles, veins, wrinkles, hair, nails, and skin tone completely, and never reproduce it. The phone (correct model) is fitted inside the exact doyers case from reference, sitting snugly within the bumper frame. The case bumper frame, in its EXACT original colour from the reference image (do NOT force black — use the real frame colour shown in the reference), is clearly visible on the edges. The centre window is CRYSTAL-CLEAR, COLOURLESS, and 100% optically transparent like glass — NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening overlay. Through it the phone\'s REAL ORIGINAL FACTORY BACK PANEL shows with its true authentic colour and finish exactly as the real phone looks; do NOT invent or substitute a colour and do NOT add any pattern, weave, or texture the real phone does not have; the only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass. The case\'s raised camera plate keeps the reference\'s exact hole count, arrangement and size, with the phone\'s lenses and flash seen through those holes — the plate is never replaced by the phone\'s own camera island. HAND POSITION (CRITICAL): the hand holds the phone FROM BEHIND and from the sides only — it stays BEHIND the phone, never in front of it. NO finger, thumb, fingertip, or nail may cross over, overlap, cover, or pass in front of the phone\'s back panel, the clear window, the bumper frame, or the camera module. The camera plate and all of its holes stay completely unobstructed and fully visible. Only the narrow edges of the fingers curling around the left and right sides, and the fingertips just peeking past the outline, may be seen — the entire back face of the cased phone is clear and unblocked, exactly as in a clean ecommerce hero shot. Do NOT let the hand grip across the back, do NOT rest a thumb on the window, and do NOT let the palm rise in front of the phone. The composition shows the back of the phone with the case, held at a natural product-photography angle. ABSOLUTELY NO TEXT: no slogan, no caption, no watermark, no logos, no brand names, no phone model text anywhere in the panel.',
  ],

  matte: [
    'PANEL 1 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image at tilted 45-degree angle. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',

    'PANEL 2 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image, back view showing camera cutouts. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',
  ],
};

export function getAngleDescriptions(caseType: string): string[] {
  return ANGLE_DESCRIPTIONS[caseType] || ANGLE_DESCRIPTIONS.transparent;
}

// Case-type-specific prompt builder. Shared by the single-generate route and
// the bulk-generate route so prompt changes apply everywhere.
export function buildCaseTypePrompt(
  caseType: string,
  phoneModel: string,
  finalPrompt: string,
  angleListText: string,
  backColor: string = ''
): string {
  // DOYERS (bulk): same self-contained approach as transparent, but four
  // panels, and the case is a coloured bumper frame with a clear back window
  // rather than an all-clear shell.
  if (caseType === 'bulk_doyers') {
    const panels = getAngleDescriptions('bulk_doyers');
    let panelList = panels.map((d, i) => `${i + 1}) ${d}`).join('\n\n');
    const bc = backColor.trim();
    if (bc) {
      panelList = panelList.replace(
        "Choose ONE of the model's real attractive launch colours (avoid plain white or silver).",
        `The phone back colour must be "${bc}".`
      );
    }
    let prompt = `Create a 4-panel grid (2x2) for the phone "${phoneModel}" with these exact panels:\n${panelList}`;
    // The dominant failure: the case's punched camera plate survives in the
    // empty-case panels but gets replaced by the phone's own camera island as
    // soon as a phone is inserted. State the rule before anything else.
    prompt += `\n\nCAMERA CUTOUT LOCK — HIGHEST PRIORITY, OBEY BEFORE EVERYTHING ELSE: Study the camera area of the uploaded reference case and COUNT its openings before drawing. The case has a raised camera housing made of the SAME OPAQUE frame material, with a specific number of holes punched through it in a specific arrangement (for example four circular holes in a 2x2 square grid). Reproduce that housing EXACTLY in ALL FOUR panels: the same hole COUNT, the same arrangement/grid, the same relative hole diameters, the same gaps between holes, the same outer shape and corner radius of the housing, the same position relative to the case's top corner, and the same raised protective lip standing proud around it.
- Do NOT redesign the camera area. Do NOT change the number of holes. Do NOT merge several holes into one big opening. Do NOT replace the punched plate with a plain rectangular window, an open cut-out, or a single oval. Do NOT rotate or re-arrange the holes.
- CRITICAL — WHEN A PHONE IS INSIDE: the case's punched camera plate STAYS. It does NOT disappear and it is NOT replaced by the phone's own camera island or by a floating camera bump. The opaque plate sits ON TOP of the phone's camera module, and the phone's lenses are seen THROUGH the punched holes — each lens sits centred inside its own hole, framed by the opaque ring of case material around it.
- If the phone has FEWER lenses than the case has holes, the extra holes simply show the phone's back panel or its flash through them — still never remove or resize a hole.
- The camera housing must look IDENTICAL in every panel, empty case and phone-inserted alike: same size, same hole count, same layout, same position. Any panel where the camera cutout differs from the reference is a hard defect and the image is unusable.`;
    prompt += `\n\nTHE CASE (READ FIRST): the uploaded reference is a doyers-style case — an OPAQUE coloured bumper frame (black in the reference) that wraps the phone's four edges, camera island, and corners, with a 100% CLEAR, COLOURLESS, GLASS-LIKE back window in the middle. Copy the frame's exact colour, width, corner shape, camera cutout, button cutouts, and port cutout from the reference. The frame is opaque and never see-through; the centre window is optically clear and adds NO tint, NO grey wash, NO smoke, NO frost, and NO darkening of its own. Where a phone is inside, it sits snugly inside the frame with the frame overlapping the phone's front edge slightly, exactly like the reference product.`;
    prompt += `\n\nEVERYTHING TACK SHARP — NO BLUR ANYWHERE: Render with a DEEP depth of field (as if shot at f/16 on a product-photography rig) so the entire phone and case are in perfect focus from edge to edge, front to back. The camera module area is the worst offender and must be the sharpest part of the image: every lens ring, the flash, the punched holes in the case plate, and the raised lip around them are crisp, clean-edged and fully resolved. There must be NO blur of any kind: no bokeh, no shallow depth of field, no defocused foreground or background, no soft focus, no motion blur, no smudging, no haze, no glow, no lens smear, and no fuzzy or melted edges around the camera bump. Do NOT blur the top of the phone while the bottom is sharp, and do NOT throw the camera area out of focus to fake depth. Every panel is uniformly sharp.`;
    prompt += `\n\nNO STREAK LOCK: there must be ZERO diagonal light streak, reflection band, glossy sheen, specular highlight, or light-to-dark gradient anywhere on the phone back, the clear window, or the bumper frame. Everything is MATTE and lit by flat, even, head-on frontal light (like a ring light at the camera).`;
    prompt += `\n\nEMPTY WINDOW RULE: wherever the case is shown WITHOUT a phone, the clear window is empty plastic — the pure white #FFFFFF background shows straight through it, pixel for pixel identical to the background outside the case. Do NOT fill, tint, shade, grey-wash, frost, or gradient the inside of the window.`;
    if (bc) {
      prompt += `\n\nBACK COLOR (MANDATORY): render the phone body seen through the clear window in every panel as a REAL phone back in "${bc}" — a soft even MATTE "${bc}" finish under flat head-on light, the same uniform "${bc}" across the whole back edge to edge. NO diagonal light streak, NO slanted bright band, NO crossing X glare, NO mirror reflection, NO gradient, no other colour, and not flat poster paint.`;
    } else {
      prompt += `\n\nPHONE COLOR (IMPORTANT): the phone in the case is "${phoneModel}". Use the REAL signature factory back colour that THIS specific model actually ships in — every brand and model has its own real colour (green, black, graphite, mint, coral, purple, gold, teal, etc.), so the colour must vary per model and match "${phoneModel}". Do NOT default to blue every time. If the model's only real colours are plain white or silver, use its darkest real colour instead. Keep it a soft even MATTE finish, one uniform shade edge to edge, with no diagonal streak or glare.`;
    }
    // Each panel is rendered semi-independently, so without an explicit lock the
    // model picks a different phone colour per cell.
    prompt += `\n\nONE COLOUR ACROSS ALL PANELS — HARD REQUIREMENT: All four panels show the SAME SINGLE physical phone in the SAME SINGLE physical case, photographed four times from different angles. It is ONE product, not four variants. Decide the phone's back colour ONCE${bc ? ` — it is "${bc}"` : ''}, then paint it the IDENTICAL colour in every panel that shows a phone (panels 1, 3 and 4): the same hue, the same saturation, the same brightness, the same matte finish, pixel-matched between panels. If you sampled the phone's back in panel 1, panel 3 and panel 4, all three must return the same colour value. Do NOT show a green phone in one panel and a blue, black, grey, purple or silver one in another. Do NOT vary the shade, tone, or lighting of the colour between panels. The case's bumper frame is likewise the SAME single colour from the reference in ALL FOUR panels, including the empty case in panel 2 — never black in one cell and grey, white or silver in another. Any colour difference between panels is a hard defect and makes the image unusable.`;
    prompt += `\n\nNO LOGOS OR TEXT: the phone back, camera module, screen, and case must be completely clean — NO brand name, NO brand logo (no Google "G", no "HONOR", no Asus/ROG logo, no Samsung/Vivo/Realme/etc.), NO model number, NO regulatory text, NO slogan, NO caption, NO watermark, nothing written anywhere in any panel.`;
    prompt += `\n\nLAYOUT: the final image is ONE 2x2 grid of exactly FOUR equal cells — cell 1 = PANEL 1 (top-left), cell 2 = PANEL 2 (top-right), cell 3 = PANEL 3 (bottom-left), cell 4 = PANEL 4 (bottom-right). Every cell is the same size. Do NOT skip, repeat, or add panels, and do NOT make any cell a wider hero banner. A panel that describes two phones or two items is still ONE single cell — keep them together inside that cell as a single photo.`;
    return prompt;
  }

  // TRANSPARENT: use ONLY the two panel instructions, with no extra global
  // rules wrapped around them. The panels themselves carry every requirement.
  if (caseType === 'transparent') {
    const panels = getAngleDescriptions('transparent');
    let panelList = panels.map((d, i) => `${i + 1}) ${d}`).join('\n\n');
    const bc = backColor.trim();
    if (bc) {
      // Use the exact requested colour instead of picking one automatically.
      panelList = panelList.replace(
        "Choose ONE of the model's real attractive launch colours (avoid plain white or silver).",
        `The phone back colour must be "${bc}".`
      );
    }
    let prompt = `Create 2-panel grid (1x2 horizontal layout) for the phone "${phoneModel}" with these exact panels:\n${panelList}`;
    if (bc) {
      prompt += `\n\nBACK COLOR (MANDATORY): render the phone body seen through the clear case in Panel 1 as a REAL phone back in "${bc}" — a soft even MATTE "${bc}" finish under flat head-on light, the same uniform "${bc}" across the whole back edge to edge. NO diagonal light streak, NO slanted bright band, NO crossing X glare, NO mirror reflection, NO gradient, no other colour, and not flat poster paint.`;
    } else {
      prompt += `\n\nPHONE COLOR (IMPORTANT): the phone in the case is "${phoneModel}". Use the REAL signature factory back colour that THIS specific model actually ships in — every brand and model has its own real colour (green, black, graphite, mint, coral, purple, gold, teal, etc.), so the colour must vary per model and match "${phoneModel}". Do NOT default to blue every time. If the model's only real colours are plain white or silver, use its darkest real colour instead. Keep it a soft even MATTE finish, one uniform shade edge to edge, with no diagonal streak or glare.`;
    }
    prompt += `\n\nNO LOGOS OR TEXT: the phone back, camera module, and screen must be completely clean — NO brand name, NO brand logo (no Google "G", no "HONOR", no Asus/ROG logo, no Samsung/Vivo/Realme/etc.), NO model number, NO regulatory text, nothing written anywhere on the phone or case.`;
    prompt += `\n\nLAYOUT: the final image is a SINGLE horizontal row of exactly TWO panels side by side — Panel 1 on the LEFT, Panel 2 on the RIGHT — in landscape orientation. Do NOT stack them vertically, do NOT make a second row, do NOT add extra panels.`;
    return prompt;
  }

  // Matte and transparent only need 2 panels (1x2 horizontal layout)
  const gridLayout = caseType === 'matte' || caseType === 'transparent' ? '2-panel grid (1x2 horizontal layout)' : '4-panel grid (2x2)';

  const backgroundGuidance =
    caseType === 'transparent' || caseType === 'doyers'
      ? 'BACKGROUND MUST BE PURE WHITE: every background pixel is exactly #FFFFFF (RGB 255,255,255) — a blown-out pure white studio sweep. It must NOT be #F5F5F5, #FAFAFA, off-white, eggshell, cream, beige, light grey, or any near-white; those are wrong. No gradient, no vignette, no darker corners, no grey floor, no visible horizon. The white is flat, even, and identical across the whole frame, and identical in both panels.'
      : 'Use a clean premium light-neutral studio background with enough contrast to define the product. Avoid harsh overexposed white that washes out edges or openings.';

  // For clear/transparent-window cases, the clear panel must NOT tint the phone.
  // It is optically clear glass; the phone's real factory back-panel color shows through.
  const clearPanelConstraint =
    caseType === 'doyers' || caseType === 'transparent'
      ? '\n- NO STREAK AND NO SHADE ON THE CASE ITSELF (CRITICAL, APPLIES TO EVERY PANEL — WITH OR WITHOUT A PHONE INSIDE): The clear plastic/TPU of the case must be rendered as flawless, colorless, anti-glare glass with one even uniform surface. NEVER draw a diagonal light streak, slanted bright band, glossy sheen, specular highlight, window/softbox reflection, glare patch, milky haze, or light-to-dark gradient across the case shell.\n- EMPTY CASE MUST BE SEE-THROUGH, NOT SHADED (CRITICAL): When the case is empty, its interior is EMPTY CLEAR PLASTIC — the pure white background must show straight through it completely unchanged. The area inside the case outline must be the SAME pure white #FFFFFF (RGB 255,255,255) as the surrounding background, pixel for pixel — if you sampled a pixel inside the case and one outside it, they must be the identical value. Do NOT fill, tint, shade, grey-wash, frost, cloud, or gradient the inside of the case. Do NOT add a soft grey body, a panel-shaped shadow, an inner glow, ambient occlusion, or any darker region inside the outline. An empty clear case on white is almost invisible: ONLY its thin outline edges, side buttons, the camera cutout ring, and a faint contact shadow on the floor are visible. Everything else inside stays exactly pure white.\n- THE EMPTY SHELL IS MATTE, NOT GLOSSY (CRITICAL): Render the empty case as a MATTE, non-reflective, perfectly even clear shell. It must show ZERO gloss: no vertical or diagonal sheen band, no soft bright panel, no light-grey wash sweeping across one side, no glass-like reflection, no shine. Many renders wrongly add a faint grey glossy panel over the middle or lower half of the empty shell — this is FORBIDDEN. If any region inside the outline is not pure white, the image is wrong.\n- CLEAR-PANEL COLOR RULE: Render the transparent area of the case as crystal-clear, colorless, anti-glare glass that shows no reflection streak. The phone body seen through it must keep its REAL original factory back-panel color, fully MATTE and lit by soft even diffuse light so it shows as ONE uniform color across the whole panel — like a flat painted surface, NOT a glossy mirror. Do NOT add a diagonal light streak or bright band, a specular highlight, a glossy sheen, a dark reflection, or a light-to-dark gradient; that reflective sheen/streak is the exact "shade" failure to avoid. Light the product with flat, even, ON-AXIS FRONTAL illumination (like a ring light at the camera or a flatbed scanner), with NO directional key light and NO side/top/window light, so no angled or diagonal highlight band can form. Keep it even, uniform, and true to the real color, with zero bright spots and never darkened toward black.'
      : '';

  // When the seller specifies the exact back-panel color, force a solid even fill of
  // that color through the clear window. This overrides color guessing and kills the
  // smoky-grey gradient (a solid fill leaves no room for a shade).
  const trimmedBackColor = backColor.trim();
  const backColorConstraint =
    trimmedBackColor && (caseType === 'doyers' || caseType === 'transparent')
      ? `\n- BACK PANEL COLOR OVERRIDE (MANDATORY, HIGHEST PRIORITY): Paint the phone's entire back panel as ONE FLAT, FULLY MATTE, UNIFORM block of "${trimmedBackColor}" — the exact same "${trimmedBackColor}" color value in every pixel, edge to edge, like a flat painted color chip lit by soft even diffuse light. ABSOLUTELY NO reflections of any kind on the back: NO diagonal light streak or bright band running across it, NO specular highlight, NO glossy sheen, NO window or softbox reflection, NO glare, NO light-to-dark gradient, NO smoke, NO grey or black shade. The panel never catches or mirrors studio light anywhere; it stays one even matte "${trimmedBackColor}" color with zero bright spots and zero darker spots. The clear case over it is anti-glare and also shows no reflection streak. Light the whole product with flat, even, ON-AXIS FRONTAL illumination — as if from a ring light at the camera position or a flatbed scanner — with NO directional key light, NO top or side light, and NO window/softbox reflection, so neither the glass nor the back panel ever forms an angled or diagonal highlight band. Use no other color, no pattern, no texture. This overrides any color or finish described anywhere else.`
      : '';

  const hasBackColor = !!trimmedBackColor && (caseType === 'doyers' || caseType === 'transparent');

  // When NO back color is specified, the model keeps defaulting the phone body to
  // plain white/silver/grey. Force a rich saturated factory color instead.
  const noWhiteDefaultConstraint =
    !hasBackColor && (caseType === 'doyers' || caseType === 'transparent')
      ? '\n- PHONE BODY COLOR (MANDATORY): The phone body seen through the clear case must be a rich, saturated, attractive factory color such as deep green, blue, purple, teal, or black. It must NEVER be plain white, silver, light grey, off-white, cream, or any pale/washed-out color. Pick a vivid non-white color and keep it as ONE flat matte uniform fill across the whole back. If the analysis suggests white/silver/grey, override it with a vivid color instead.\n- BACK SURFACE MUST BE SMOOTH AND PLAIN (MANDATORY): The back panel is one smooth flat matte painted surface. Do NOT invent any texture or pattern: NO leather or faux-leather, NO stitching, NO seams, NO vertical or horizontal divider line down the middle, NO panel split, NO two-tone halves, NO carbon-fiber, NO weave, NO grain, NO ribs, NO frosted pattern, NO logo, NO embossing. It is a clean uniform colored surface edge to edge with nothing printed or molded on it.'
      : '';

  // Stated FIRST so it wins over any finish the analysis invented (e.g. "graphite/black").
  const colorLock = hasBackColor
    ? `TOP-PRIORITY COLOR LOCK — READ THIS FIRST AND OBEY IT ABOVE EVERYTHING BELOW: The phone's back panel must be a solid, uniform, flat "${trimmedBackColor}" in EVERY panel. If anything below — including the MASTER CASE ANALYSIS or any finish description — names a different phone body color or finish (for example black, graphite, gunmetal, titanium, midnight, grey, or silver), treat that as WRONG and use "${trimmedBackColor}" instead. The "${trimmedBackColor}" back panel is mandatory and non-negotiable.\n\n`
    : '';

  // High-priority locks, stated at the very top, for clear/transparent cases.
  const streakLock =
    caseType === 'doyers' || caseType === 'transparent'
      ? `TOP-PRIORITY NO-STREAK LOCK — OBEY ABOVE ALL ELSE: There must be ZERO diagonal light streak, reflection band, bright diagonal line, glossy sheen, specular highlight, or light-to-dark gradient anywhere on the phone back OR on the clear case. The phone back and the clear case are BOTH fully MATTE and lit by flat, even, head-on frontal light only (like a ring light at the camera), so no angled highlight can form. A diagonal streak or glossy band is a hard defect — the surface must read as one even matte tone edge to edge.\n\n`
      : '';
  const cornerLock =
    caseType === 'doyers' || caseType === 'transparent'
      ? `TOP-PRIORITY CORNER LOCK — OBEY ABOVE ALL ELSE: The case corners must be SLIM and the SAME thickness as the reference image — flush, low-profile, and only slightly thicker than the side walls. Do NOT enlarge, inflate, bulge, round, or pad the corners into chunky raised bumpers, big rounded blobs, thick air-cushion pads, shock-absorber knobs, or rugged-armor corners. Even if this is a shockproof / anti-drop case, keep the reinforced corners as small and thin as they appear in the reference — never bigger. Match the reference corner size exactly; any extra corner bulk is a hard defect.\n\n`
      : '';

  // Don't let "keep the same factory finish" re-assert the analysis color.
  const phoneFinishLine = hasBackColor
    ? `Keep the phone back panel a consistent solid "${trimmedBackColor}" in every panel; this color overrides any finish named in the analysis.`
    : 'Keep the same authentic factory phone finish in every panel.';

  // Put the exact color right inside each panel instruction, where the model renders.
  const panelText = hasBackColor
    ? angleListText.replace(/back panel/gi, `back panel (solid uniform ${trimmedBackColor})`)
    : angleListText;

  // Clear cases (transparent/doyers) get the water-clear / hand-through-plastic
  // rules. Opaque cases (black, matte, etc.) must instead COPY the case's real
  // color and finish from the reference — applying the clear rules to them makes
  // the model render an opaque case as see-through.
  const isClear = caseType === 'doyers' || caseType === 'transparent';

  const referenceReadingRules = isClear
    ? `- HOW TO READ THE REFERENCE PHOTO (READ FIRST — MOST IMPORTANT): The reference is a casual photo of the real physical case being HELD IN A HAND in front of a plain grey/white wall. Everything visible THROUGH the clear case is the photographer's hand and the room behind it — it is NOT part of the case and must NEVER be copied. Specifically IGNORE and DO NOT reproduce: the hand, palm, fingers, fingernails, knuckles, skin tone, arm hair, the grey/white backdrop, the room lighting, any beige/brown/tan/grey tint the skin casts through the plastic, the soft diagonal light-to-dark boundary where the hand ends and the wall begins, and any haze, shading, or gradient created by them. The case's actual material is 100% colorless, untinted, water-clear plastic with nothing behind it. Do NOT render a hand in any panel unless that panel explicitly asks for one.
- TAKE ONLY GEOMETRY FROM THE REFERENCE: The ONLY things to copy from the reference photo are physical shape facts — outer silhouette and proportions, corner shape and thickness, camera opening shape/size/position, the raised camera lip, button cutouts, port cutout, and side lip thickness. Take NOTHING about color, tint, shading, or lighting from the photo, because those come from the hand and the room, not from the case.`
    : `- The reference photo may show the case held in a hand; ignore the hand, fingers, and background — reproduce only the case itself.
- Copy the case colors, transparency, tint, artwork, material, and surface finish exactly from the reference image. Do not reinterpret, simplify, recolor, or redesign anything.`;

  const clearOnlyRules = isClear
    ? `\n- REINFORCED AIR-CUSHION CORNERS (CRITICAL — REPRODUCE THEM, NEVER DELETE THEM): This is an anti-shock TPU case. Look at the reference: EACH of the four corners has a visibly THICKER, raised air-cushion corner pad — a reinforced block of clear plastic, usually with a subtle internal rib/hatch pattern inside it, that projects slightly further out than the slim side walls. These corner pads are a defining feature of this product and MUST appear in every panel, on all four corners, in the same position and at the same MODEST size and thickness as the reference. Do NOT delete them, do NOT flatten them into plain slim rounded corners, and do NOT smooth them away. Equally, do NOT exaggerate them into chunky rugged-armor blocks or fat bulging bumpers — reproduce the reference's restrained size exactly.
- CASE MUST STAY VISIBLE ON THE PHONE: In the panel where the phone is inside the case, the case must read clearly as a separate protective shell around the phone — show its outer edge line, its side lip overlapping the phone's front, its reinforced corner pads, its button covers, and the raised rim around the camera opening. The case must never shrink into an invisible skin or a thin outline that looks like the bare phone.
- THE CASE IS COLORLESS: Reproduce the case as clean, water-clear, completely colorless and untinted plastic. It has no color of its own, no print, no artwork, and no pattern. Any tint or shading you think you see in the reference is the hand behind it — ignore it. Copy shape from the reference, never color or shading.`
    : '';

  const referencePriority = isClear
    ? `- If any instruction conflicts with the uploaded reference image, follow the reference image for CASE GEOMETRY ONLY (silhouette, corners, cutouts, camera lip, lip thickness).
- Never follow the reference for color, tint, shading, lighting, or background — the reference is a hand-held snapshot, so those belong to the hand and the room, not the case. Colors, lighting, and background always come from the instructions above.`
    : `- If any instruction conflicts with the uploaded reference image, follow the uploaded reference image for case geometry, case color, transparency, and material finish.`;

  const mainPrompt = `${streakLock}${cornerLock}${colorLock}Create a premium ${gridLayout} ecommerce collage for "${phoneModel}" using the uploaded reference image as the non-negotiable case template.

MASTER CASE ANALYSIS:
${finalPrompt}

GLOBAL HARD CONSTRAINTS:
${referenceReadingRules}
- Preserve the case geometry from the reference image exactly: outer silhouette, camera island placement, lens opening sizes, corner radius, button cutouts, and side lip thickness.
- CAMERA PROTECTION LIP (CRITICAL — DO NOT OMIT): The case MUST include its raised camera-protection rim exactly as in the reference: a raised wall/lip of the case material that stands proud around the entire camera module opening and rises ABOVE the lens surface so the lenses never touch a flat surface. Render this raised border clearly with its visible thickness and edge highlight around the cutout. Do NOT flatten it, do NOT omit it, do NOT let the case end flush with the camera island, and do NOT leave the camera module sticking out uncovered past the case. The camera opening must read as a recessed well surrounded by a raised protective ring.${clearOnlyRules}
- Use one identical phone-and-case asset consistently across all panels. Only the viewing angle, crop, or hand pose may change.
- ${phoneFinishLine}
- If the case has transparent, frosted, or open sections, the real phone body must remain visible underneath in its authentic finish. Never replace the visible phone area with flat white, flat black, blank filler, paper inserts, or empty placeholders.
- Any front-facing phone screen must show realistic front glass, correct bezels and cutouts, and a tasteful unbranded abstract wallpaper or dim lockscreen gradient. Never output a blank white screen or a pure black screen.
- WALLPAPER — DRAW EXACTLY THIS: the on-screen wallpaper is a SMOOTH, SOFT-FOCUS TWO-TONE COLOUR GRADIENT and nothing else — like a blurred mist of colour blending diagonally from one muted tone into another (for example dusty blue into soft violet, or deep teal into midnight navy). It is pure blended colour with no subject matter. It must contain NO letters, NO numbers, NO digits, NO large glyph or character shapes, NO logos, NO multi-colour brand marks, NO icons, NO clock, and NO widgets. NEVER reproduce the manufacturer's stock or marketing wallpaper — those often contain a huge model number or letter (like a giant "3" or "4a") and are strictly forbidden. If you are unsure what to draw, draw a plain smooth diagonal two-colour gradient.
- ${backgroundGuidance}${clearPanelConstraint}${backColorConstraint}${noWhiteDefaultConstraint}
- Lighting must stay premium and catalog-clean, but still give enough edge separation so transparent materials remain visible.
- ABSOLUTE RULE — NO TEXT ON THE PHONE OR CASE: Do NOT render any phone model name, brand name, manufacturer name, logo, serial number, regulatory text, or any lettering anywhere on the phone body, the case, the screen bezel, or anywhere in the image. This includes text like "Samsung", "iPhone", "Realme", "Redmi", "OnePlus", "Poco", "Vivo", "Oppo", model numbers, or any other identifier. The phone and case surfaces must be completely clean of all text and logos. If the real phone has a brand embossed on the back, do NOT render it — leave that area clean and blank. Violating this rule makes the image unusable.
- Keep every panel visually consistent as if photographed in the same product shoot.

REFERENCE IMAGE PRIORITY:
${referencePriority}

LAYOUT ENFORCEMENT (CRITICAL — THE GRID MUST BE EXACT):
- The output is ONE ${gridLayout} and nothing else. ${gridLayout.startsWith('2') ? 'Exactly TWO equal cells in a single horizontal row.' : 'Exactly FOUR equal cells arranged as 2 rows by 2 columns.'}
- Each cell is the SAME size. Do NOT make any cell larger, do NOT add a big hero/feature panel, and do NOT add a wide left or right banner panel.
- Render EXACTLY one panel per cell, in order: cell 1 = PANEL 1, cell 2 = PANEL 2, cell 3 = PANEL 3, cell 4 = PANEL 4. Do NOT skip a panel, do NOT repeat any panel, and do NOT add extra panels or cells.
- IMPORTANT: A panel that describes two phones is still ONE SINGLE cell — both phones belong together inside that one cell as a single photo. Do NOT split the two phones into separate cells. ${gridLayout.startsWith('2') ? 'So cell 1 (left) holds BOTH phones of PANEL 1 together, and cell 2 (right) holds the empty case of PANEL 2. That is all — only two cells total.' : ''}
- Each text label appears AT MOST ONCE total. Never duplicate "Hybrid Design", "Flaunt The Original Look", or any other label across cells.
- The total cell count must equal exactly ${gridLayout.startsWith('2') ? 'TWO (count them: 1, 2 — stop)' : 'FOUR'}. No third/fifth panel, no inset, no collage-within-a-collage, no stacking a second row.

Create ${gridLayout} with these exact panels:
${panelText}`;

  return mainPrompt;
}
