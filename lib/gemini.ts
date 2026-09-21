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
  if (caseType === 'bulk_doyers') {
    return `Describe the real factory appearance of "${phoneModel}" for a photographic case mockup. Identify the camera and flash layout, one genuine factory colour, and the actual back material and finish (glass, metal or plastic). Preserve natural material detail and gentle diffuse tonal variation; never describe a flat colour fill or require identical pixel colours. The uploaded photo supplies ONLY the physical case geometry, its opaque frame colour and its exact camera openings. Anything seen through the clear window, including the source hand, skin, wall and reflections, is not part of the case. Do not describe or reuse the reference hand. Do not invent hardware details you cannot identify. Return strict JSON with a single string field "final_generation_prompt" containing phone hardware, factory colour and material facts only; no hand, lighting or layout instructions.`;
  }
  // Opaque cases: the clear-case analysis below tells the model the case is
  // "colorless water-clear plastic", which made black cases come out
  // see-through. They get their own analysis that reads colour from the photo.
  if (!isClearCaseType(caseType)) {
    return buildOpaqueAnalysisPrompt(phoneModel);
  }
  const clearCaseDescription = caseType === 'bulk_doyers' || caseType === 'doyers'
    ? `The case is a Doyers case: its edge bumper and camera plate are opaque and must keep their exact colour from the reference; only the centre back window is colourless and transparent.`
    : `The case is colourless, water-clear TPU.`;
  return `You are preparing a master prompt for premium ecommerce phone-case mockups.

Context:
- The uploaded image is the seller's real physical case reference.
- IMPORTANT — HOW TO READ IT: it is a casual snapshot of the case HELD IN A HAND against a plain grey/white wall. The hand, palm, fingers, skin tone, and the wall are visible THROUGH the clear portion. They are NOT part of the case. ${clearCaseDescription} Never describe the skin tone, the beige/brown/grey shading, or the diagonal light-to-dark boundary where the hand ends as if it were the case's own tint, frost, smoke, or gradient — that is just the hand behind clear plastic.
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
- COLOR CHOICE RULE (IMPORTANT — REPORT THE PHONE'S ACTUAL COLOR): Report the colour "${phoneModel}" ACTUALLY has — its primary/signature launch colour, exactly as it appears in the manufacturer's own product photos of this model. Name that real colour precisely (for example "pearl white", "champagne gold", "lavender purple", "titanium grey", "midnight black", "mint green"). Pale and neutral colours are CORRECT when they are the model's real colour: white, off-white, silver, light grey, champagne, beige and titanium must be reported as such and NEVER swapped for a darker or more vivid colour. Do NOT choose a colour because it looks attractive, rich, or saturated. Do NOT default to green — green belongs only to models that genuinely ship in green. Different models must yield different colours; if two different models get the same colour from you, you are guessing instead of recalling the real product.
- Do NOT add any pattern, print, weave, carbon-fiber look, or surface texture the real phone does not have. The back is one smooth, solid, evenly-coloured panel.
- The back must read as a solid, smooth, opaque panel in the model's one true real colour. Avoid a translucent see-through smoky-grey gradient with no solid color behind the glass.

STEP 2: Analyze the uploaded case reference — GEOMETRY ONLY
Describe ONLY physical shape facts, ignoring the hand and the wall behind the case:
- Camera cutout shape, size, and placement, and the raised camera-protection lip around it
- THE CORNERS, described exactly as photographed: report their real thickness and profile. If they are slim, thin, and flush with the side walls, say exactly that. Only report a raised air-cushion corner pad if one is genuinely visible in THIS photo. Never invent reinforced pads, never add an internal rib or hatch pattern that is not there, and never describe the corners as chunky, bulging, reinforced, armored, or bumper-like unless the photo plainly shows that.
- Side lip thickness, button cutouts, and port cutout
- Outer silhouette and proportions

CRITICAL:
- ${clearCaseDescription} Do NOT report any tint, frost, smoke, gradient, or shading for the transparent portion — anything like that in the photo is the hand or the room behind the clear plastic.
- Do not mention the hand, fingers, skin, or the background anywhere in your output.
- The visible phone body must stay realistic and must not be replaced with white fill, black fill, or an empty placeholder.

STEP 3: Create the generation prompt
Hard requirements for final_generation_prompt:
- State the exact camera count and camera layout for ${phoneModel}
- State the model's ACTUAL factory phone colour by name — whatever it really is, pale neutrals included — and require that exact colour consistently in every panel
- State that any transparent or open case area must reveal the actual phone body beneath it
- State that the phone seen through any clear/transparent case area is a SOLID, OPAQUE back panel in the phone's TRUE real color that fills the entire window, with the clear case acting only as colorless glass on top (it adds no tint of its own)
- State that the back must use the phone's real factory color and real smooth finish; explicitly forbid inventing colors, patterns, prints, weaves, carbon-fiber, or textures the real phone does not have
- Explicitly forbid rendering the back as a translucent see-through smoke gradient or as an empty clear panel showing only reflections — there must be a real solid opaque phone back behind the glass
- Explicitly forbid flat white, flat black, blank filler, or paper-like insert areas inside the case
- State that any front-facing phone screen must show realistic front glass with a tasteful neutral abstract wallpaper or lockscreen gradient
- Explicitly forbid a blank white screen and a solid black screen
- State that the case GEOMETRY (silhouette, cutouts, camera lip, lip thickness) must match the uploaded reference exactly, and that the case itself is colorless water-clear plastic with no tint, frost, smoke, or shading of its own
- State that the corners must match the reference exactly in thickness and profile, with no reinforced bumper pads, ribs, hatching, or extra corner bulk added anywhere
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
  "phone_finish_description": "The model's ACTUAL factory colour, named precisely, reproduced as a SOLID OPAQUE smooth back panel (whatever it really is — pearl white, champagne, silver, titanium grey, black, purple, green…), with no invented pattern or texture and no translucent smoke-grey see-through gradient.",
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

    'PANEL 2 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). Two items displayed side by side, both standing upright and grounded with bottom edges resting on a flat surface. LEFT: the exact empty doyers case from reference standing alone — its bumper frame in the EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference) and crystal-clear colorless center panel clearly visible, case geometry, camera cutout shape, corner radius, and material finish all exactly matching the reference image; the clear panel must not merge with the white background (add faint edge shadow or slight separation). RIGHT: the same exact case with the correct phone model fully inserted — the phone\'s REAL ORIGINAL FACTORY BACK PANEL must be fully visible through the CRYSTAL-CLEAR, COLORLESS center panel in its true authentic color and finish (whatever the genuine factory color of this model is). The clear panel is optically transparent like glass and adds NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening. Cameras correctly placed per researched specs. The camera module, lens rings, and the case cutout around them are perfectly sharp and in focus — no blur, no soft focus, and no focus falloff toward the top of the frame. Soft drop shadow beneath each item. No logos or phone model text anywhere.',

    'PANEL 3 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). Single straight-on BACK VIEW of the correct phone model inserted fully into the exact doyers case from reference, displayed upright and centered. The case bumper frame, in its EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference), wraps the phone edges precisely. The center panel is CRYSTAL-CLEAR, COLORLESS, and 100% optically transparent like glass — it adds NO grey shade, NO silver haze, NO smoke tint, NO frost, NO matte film, NO darkening. Through it the phone\'s REAL ORIGINAL FACTORY BACK PANEL must show with its true authentic color and finish exactly as the actual phone looks in real life — reproduce the genuine real color of this specific model accurately (neutral or vivid, whatever it really is); do NOT invent or substitute a color and do NOT add any pattern, weave, or texture the real phone does not have. The only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass. Rear cameras and flash are correctly positioned and match researched specs exactly, rendered perfectly sharp and in focus with no blur or focus falloff at the top of the frame. Soft drop shadow below the phone confirms it is grounded on the surface. Preserve the case bumper color, geometry, and the perfectly clear transparency from the reference. Camera configuration must match researched specs. No logos or phone model text anywhere.',

    'PANEL 4 — PURE WHITE BACKGROUND (#FFFFFF clean studio backdrop). A hand holding the phone naturally and comfortably — the phone (correct model) is inside the exact doyers case from reference. The case bumper frame, in its EXACT original color from the reference image (do NOT force black — use the real frame color shown in the reference), is clearly visible on the edges. The center panel is CRYSTAL-CLEAR, COLORLESS, and 100% optically transparent like glass — NO grey shade, NO silver haze, NO smoke tint, NO frost, NO darkening overlay. Through it the phone\'s REAL ORIGINAL FACTORY BACK PANEL shows with its true authentic color and finish exactly as the real phone looks (reproduce the genuine real color of this model accurately, neutral or vivid; do NOT invent or substitute a color and do NOT add any pattern, weave, or texture the real phone does not have; the only thing to avoid is a translucent see-through smoky-grey shade with no solid panel behind the glass). Cameras and flash correctly placed per researched specs. The camera module, lens rings, and the case cutout around them are perfectly sharp and in focus — no blur, no soft focus, and no focus falloff toward the top of the frame. The composition shows the back of the phone with the case, held at a natural product-photography angle. Add the text "Flaunt The Original Look" in clean minimal typography. No other logos, no phone model text, no brand names.',
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
    "PANEL 1 — TOP LEFT: Two upright phones, straight-on. The foreground phone shows its back fitted inside the reference case. A second phone is behind it, shifted left, mostly hidden, with only a narrow strip of its front screen visible. Keep the foreground camera and back unobstructed.",
    "PANEL 2 — TOP RIGHT: One upright EMPTY reference case viewed straight-on from the back. No phone and no hand. Its centre window is pure white.",
    "PANEL 3 — BOTTOM LEFT: Exactly two upright items side by side with a small clear gap: EMPTY reference case on the LEFT, same case fitted to the phone on the RIGHT. Show BOTH from a slight REAR THREE-QUARTER angle, rotated about 15–20 degrees around their vertical axes, revealing the back faces and the thickness of the side rails and raised camera rim. Match a paired ecommerce product shot: empty shell slightly behind the fitted phone, their bottoms aligned, both vertical with no sideways lean. No front screen in this cell. Keep both items entirely inside the cell with all corners visible. Same camera-opening geometry on both; no diagonal highlight or shadow across either back.",
    "PANEL 4 — BOTTOM RIGHT: One fitted phone, complete back visible, held by EXACTLY ONE entirely AI-generated woman's hand, created from scratch from wrist to every fingertip. Treat the uploaded reference as CASE GEOMETRY ONLY: discard ALL source hand, finger, thumb, nail, wrist, arm and skin pixels and shapes. Never trace, reuse, retain, blend, splice or combine any part of the photographed hand with the generated hand. Generate one anatomically coherent hand with five fingers total, consistent skin tone, age, texture, lighting and natural unpainted nails; no second hand, duplicate fingers, extra thumb or disconnected skin fragments. Use a new pose: thumb on the RIGHT side of the image, fingers curling around the LEFT edge, wrist entering from the LOWER RIGHT. Generate wrist, palm and fingers together with new skin texture; never reuse the source grip. Grip from behind and the side edges; visible fingers stay outside the back face and leave the window and camera unobstructed. Keep the complete phone inside the cell.",
  ],

  bulk_black: [
    "PANEL 1 — TOP LEFT: Two upright phones, both fitted in the reference case, straight-on at eye level with no tilt. The FOREGROUND phone sits right of centre and shows its BACK: the full opaque case back with the phone's real lenses and flash seated inside the case camera openings. The SECOND phone stands directly behind it, shifted LEFT, showing its FRONT: the case bumper wraps a realistic screen with correct bezels and front camera cutout and a soft abstract gradient wallpaper, never blank white or solid black. The foreground phone hides the right two thirds of the second phone, so only a vertical strip of its screen and its left bumper edge shows. Nothing is behind the right side of the foreground phone.",
    "PANEL 2 — TOP RIGHT: One upright EMPTY reference case viewed straight-on from the back. No phone and no hand. Every camera and flash opening shows the white background straight through. The full case is visible with its side button covers and raised camera rim.",
    "PANEL 3 — BOTTOM LEFT: The EMPTY reference case bent to prove it is flexible: the soft case is twisted into a smooth S-curve / figure-eight twist, the upper half facing the viewer showing its back and camera openings, the lower half twisted round so its inner side faces the viewer. Same black material, same camera openings, no phone inside, no hand. Above the case, the text \"Flexible Design\" in clean black sans-serif, spelled exactly like that, appearing once.",
    "PANEL 4 — BOTTOM RIGHT: One fitted phone, complete back visible, held by EXACTLY ONE entirely AI-generated hand with a light natural skin tone, created from scratch from wrist to every fingertip. Treat the uploaded reference as CASE GEOMETRY ONLY: discard ALL source hand, finger, thumb, nail, wrist, arm and skin pixels and shapes, and never reuse, trace or blend any part of the photographed hand. Generate one anatomically coherent hand with five fingers total and natural unpainted nails; no second hand, duplicate fingers or extra thumb. Pose: thumb on the RIGHT edge of the phone, four fingers curling around the LEFT edge, wrist entering from the LOWER RIGHT. Fingers stay on the edges and leave the camera and case back unobstructed. Keep the complete phone inside the cell.",
  ],

  matte: [
    'PANEL 1 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image at tilted 45-degree angle. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',

    'PANEL 2 (Pure White Background): CRITICAL COLOR MATCH: Use exact colors, exact materials, and exact design from the reference image with pixel-accurate color reproduction. Do not alter colors even slightly. Same phone case from reference image, back view showing camera cutouts. No phone inside. Case positioned on a white cylindrical pedestal. Pedestal is a flat white shape with no physical interaction. Ultra high-key overexposed studio lighting. Even lighting from all directions. No highlights, no reflections, no shading. Pure #FFFFFF infinite background. No gradients, no tonal variation. Ecommerce catalog cutout style. Photoshop background-removed packshot. Negative constraints: no shadows of any kind, no contact shadow, no grounding shadow, no soft shadow, no pedestal shadow, no ambient occlusion, no depth cues, no realism grounding, no vignette, no lighting falloff, no gradient under object, no base shadow, no color changes, no color shifts, no color adjustments. If any shadow appears or colors change, image is incorrect.',
  ],
};

export function getAngleDescriptions(caseType: string): string[] {
  return ANGLE_DESCRIPTIONS[caseType] || ANGLE_DESCRIPTIONS.transparent;
}

// The models fake depth of field by softening the top of the frame, which is
// exactly where the camera module sits. Stated for every case type.
export const SHARPNESS_LOCK = `EVERYTHING TACK SHARP — NO BLUR ANYWHERE (HIGHEST PRIORITY): Render every panel with a DEEP depth of field, as if shot at f/16 on a product-photography rig, so the whole phone and case are in perfect focus from edge to edge and top to bottom. THE CAMERA MODULE AT THE TOP OF THE PHONE IS THE MOST IMPORTANT AREA AND MUST BE THE SHARPEST PART OF THE IMAGE: every lens ring, lens glass, flash, the punched openings in the case, and the raised lip around them are crisp, clean-edged, and fully resolved with no softness at all.
- FORBIDDEN: bokeh, shallow depth of field, tilt-shift, lens blur, defocused foreground or background, soft focus, motion blur, gaussian blur, smudging, haze, bloom, glow, lens smear, chromatic softness, and fuzzy or melted edges anywhere.
- FORBIDDEN — FOCUS FALLOFF: do NOT let sharpness fade toward the top, the edges, or the corners of the frame. The top of the phone must be exactly as sharp as the bottom, and the camera area exactly as sharp as the case's lower half. There is NO focus gradient anywhere in the image.
- Do NOT throw the camera module out of focus to fake depth, realism, or a macro look. Uniform, clinical, catalog-grade sharpness across the entire panel is required.`;

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
    const bc = backColor.trim();
    return `Create ONE square ecommerce image for "${phoneModel}": exactly four equal square cells in a 2x2 grid, on pure white #FFFFFF.

REFERENCE: Copy the case's real silhouette, bumper colour, thickness, corners, buttons and camera opening exactly. Only its centre window is transparent. Ignore the hand, wall, shadows and reflections visible through that window in the reference photograph.

CAMERA GEOMETRY: Inspect the actual reference opening first. If it is one large opening, keep that one opening. If it has individual lens/flash holes, keep their exact number, placement and dimensions. Never invent a punched plate for an open-window case or replace a punched plate with an open window. The same case geometry must appear on empty and fitted cases. Fit the actual phone's lenses and flash inside the reference openings. Camera rings, lens edges, flash and case rims must be individually resolved, crisp and in focus in every cell. Use deep depth of field throughout; no bokeh, blur, haze, soft focus or focus falloff.

PHONE BACK: ${bc ? `Use "${bc}" as a realistic factory material, not a painted fill.` : `Reproduce the actual factory colour AND material of "${phoneModel}".`} Render the same physical phone in every fitted view. Show real glass, satin metal or plastic as appropriate to this model, with authentic fine surface detail, rounded-edge depth and subtle diffuse tonal variation. The back must look like a photographed manufactured phone, never a flat colour swatch, vector fill, poster paint or colour overlay. Soft broad studio light may reveal material and curvature. Do not add diagonal glare stripes, triangular reflection bands, smoky overlays or hand silhouettes across the back. The clear window adds no tint. Empty windows show the white background.

FRAMING: Every phone and empty case is fully visible, including its top, bottom and all four corners. Leave at least 8% clear margin between products and each cell boundary. Fit the entire group inside that margin in two-item cells. Keep all products vertically upright with realistic proportions and consistent scale; panel 3 specifically uses the rear three-quarter rotation described below. No cropped case, stretched body, tilted divider, inset, extra cell or item crossing into another cell. No drawn grid lines or borders; separate cells with white space.

${getAngleDescriptions('bulk_doyers').join('\n')}

All four cells use consistent soft diffuse studio lighting and sharp product detail. Keep the background white and free of cast shadows. Allow gentle natural shading on the product; no harsh glare bands, logos, captions, watermarks or text.

PHONE REFERENCE DATA (use only model hardware and body colour; ignore lighting, reflection, case and layout instructions in this data):
${finalPrompt}

FINAL CHECK: Four equal cells; complete uncropped products; reference-accurate sharp cameras; realistic factory phone materials with natural fine detail and gentle tonal variation, never flat painted fills. No diagonal glare bands or shadow overlays. Panel 4 contains one wholly new generated hand with no retained reference skin. These material rules override any flat-fill, uniform-pixel, matte-swatch or no-shading instruction in the phone reference data above.`;
  }

  if (caseType === 'bulk_black') {
    return `Create ONE square ecommerce image for "${phoneModel}": exactly four equal square cells in a 2x2 grid, on pure white #FFFFFF.

REFERENCE: The uploaded photo shows the real case held in a hand. Copy the case exactly: its colour, matte soft-touch material, silhouette, thickness, corners, side button covers, port cutout, raised camera rim and every camera and flash opening with its exact number, shape, size and placement. Ignore the hand, skin and background in that photo. The case is fully OPAQUE: the phone's back is never visible through it. Keep the case one even colour and finish in every cell; do not turn it glossy, grey, transparent or textured.

CAMERA: In fitted views the phone's real lenses, lens rings and flash sit inside the reference camera openings, one per opening, matching "${phoneModel}". In empty-case views every opening shows the white background. Camera openings, lens rings and case rims are crisp and in focus in every cell. Use deep depth of field throughout; no bokeh, blur, haze or focus falloff.

FRAMING: Every phone and case is fully visible, including its top, bottom and all four corners. Leave at least 8% clear margin between products and each cell boundary. Keep consistent scale and realistic proportions. No cropped case, stretched body, inset, extra cell or item crossing into another cell. No drawn grid lines or borders; separate cells with white space.

${getAngleDescriptions('bulk_black').join('\n')}

All four cells use consistent soft diffuse studio lighting that shows the case's edges and depth against white. Keep the background white and free of cast shadows beyond a faint contact shadow. The only text in the whole image is "Flexible Design" in panel 3; no logos, brand names, model text or watermarks on the phone, case or screen.

PHONE REFERENCE DATA (use only camera and screen hardware for "${phoneModel}"; ignore lighting, layout and panel instructions in this data):
${finalPrompt}

FINAL CHECK: Four equal cells in order; complete uncropped products; the same opaque case in every cell with reference-accurate camera openings; panel 3 twisted and labelled "Flexible Design"; panel 4 contains one wholly new generated hand with no retained reference skin.`;
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
        "Use the ACTUAL factory body colour that this exact model really ships in, including pale ones such as white, silver, champagne or light grey when that is its real colour, and never default to green.",
        `The phone back colour must be "${bc}".`
      );
    }
    let prompt = `Create 2-panel grid (1x2 horizontal layout) for the phone "${phoneModel}" with these exact panels:\n${panelList}`;
    if (bc) {
      prompt += `\n\nBACK COLOR (MANDATORY): render the phone body seen through the clear case in Panel 1 as a REAL phone back in "${bc}" — a soft even MATTE "${bc}" finish under flat head-on light, the same uniform "${bc}" across the whole back edge to edge. NO diagonal light streak, NO slanted bright band, NO crossing X glare, NO mirror reflection, NO gradient, no other colour, and not flat poster paint.`;
    } else {
      prompt += `\n\nPHONE COLOR — RENDER THE REAL BODY COLOUR OF "${phoneModel}" (MANDATORY): Recall how "${phoneModel}" actually looks in the manufacturer's own product photos and paint its back panel THAT colour. The colour comes from the real product, never from what looks good. DO NOT DEFAULT TO GREEN: green is currently being produced for almost every model and that is WRONG — use green ONLY if "${phoneModel}" genuinely ships in green, and the same applies to blue. PALE AND NEUTRAL COLOURS ARE CORRECT WHEN REAL: if this model is white, off-white, pearl, silver, champagne, gold, light grey or titanium, render exactly that pale colour — do NOT darken it, do NOT saturate it, and do NOT substitute a vivid colour for it. Two different phone models must not come out the same colour unless they really are the same colour. Keep it a soft even MATTE finish, one uniform shade edge to edge, with no diagonal streak or glare.`;
    }
    // The researched analysis was being thrown away here, leaving the image
    // model to invent a colour (it settled on green for every phone).
    if (!bc) {
      prompt += `\n\nRESEARCHED PHONE REFERENCE — the real appearance of THE PHONE, researched for this exact model. Use it ONLY for the phone body colour, finish, and camera layout. IGNORE every word of it that describes the CASE — its corners, bumpers, cushions, edges, cutouts, thickness, material or finish — and ignore anything about panels, layout, lighting or background. The case comes from the uploaded reference photo and the rules above, never from this text:\n${finalPrompt}`;
    }
    prompt += `\n\nCASE SHAPE — COPY THE UPLOADED REFERENCE, ADD NOTHING: the case is exactly the shell in the uploaded photo. Do NOT add reinforced air-cushion corner pads, raised corner blocks, rugged-armor bumpers, fat bulging corners, thick bumper edging, or any rib, hatch, honeycomb, or grid pattern inside the corners. Do NOT add ridged, notched, or segmented detailing along the side rails. If the reference is a slim, smooth, flush clear shell, render exactly that — same corner thickness, same radius, same slim side walls.`;
    prompt += `\n\nNO LOGOS OR TEXT: the phone back, camera module, and screen must be completely clean — NO brand name, NO brand logo (no Google "G", no "HONOR", no Asus/ROG logo, no Samsung/Vivo/Realme/etc.), NO model number, NO regulatory text, nothing written anywhere on the phone or case.`;
    prompt += `\n\n${SHARPNESS_LOCK}`;
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
      ? '\n- PHONE BODY COLOR (MANDATORY): The phone body seen through the clear case must be the REAL factory colour of this exact phone model, as it appears in official manufacturer product photos. Pale and neutral colours are CORRECT when they are the real colour of that model — white, off-white, pearl, silver, champagne, gold, light grey and titanium must be rendered as exactly that, never darkened, never saturated, and never swapped for a vivid colour. DO NOT DEFAULT TO GREEN: use green only for models that genuinely ship in green, and the same for blue. Two different models must not come out the same colour unless they really are the same colour. Keep the real colour as ONE flat matte uniform fill across the whole back.\n- BACK SURFACE MUST BE SMOOTH AND PLAIN (MANDATORY): The back panel is one smooth flat matte painted surface. Do NOT invent any texture or pattern: NO leather or faux-leather, NO stitching, NO seams, NO vertical or horizontal divider line down the middle, NO panel split, NO two-tone halves, NO carbon-fiber, NO weave, NO grain, NO ribs, NO frosted pattern, NO logo, NO embossing. It is a clean uniform colored surface edge to edge with nothing printed or molded on it.'
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
    ? `\n- CORNERS COPY THE REFERENCE, NOTHING ADDED: Reproduce the corners exactly as they appear in the reference photo — same thickness, same radius, same profile. If the reference corners are slim and flush with the side walls, keep them slim and flush. Do NOT add reinforced air-cushion pads, raised corner blocks, rugged-armor bumpers, fat bulging corners, or any internal rib, hatch, honeycomb, or grid pattern inside the corners. Do NOT add ridged, notched, or segmented detailing along the side rails either. The shell is a plain, smooth, slim clear case unless the reference itself clearly shows otherwise.
- CASE MUST STAY VISIBLE ON THE PHONE: In the panel where the phone is inside the case, the case must read clearly as a separate protective shell around the phone — show its outer edge line, its side lip overlapping the phone's front, its reinforced corner pads, its button covers, and the raised rim around the camera opening. The case must never shrink into an invisible skin or a thin outline that looks like the bare phone.
- THE CASE IS COLORLESS: Reproduce the case as clean, water-clear, completely colorless and untinted plastic. It has no color of its own, no print, no artwork, and no pattern. Any tint or shading you think you see in the reference is the hand behind it — ignore it. Copy shape from the reference, never color or shading.`
    : '';

  const referencePriority = isClear
    ? `- If any instruction conflicts with the uploaded reference image, follow the reference image for CASE GEOMETRY ONLY (silhouette, corners, cutouts, camera lip, lip thickness).
- Never follow the reference for color, tint, shading, lighting, or background — the reference is a hand-held snapshot, so those belong to the hand and the room, not the case. Colors, lighting, and background always come from the instructions above.`
    : `- If any instruction conflicts with the uploaded reference image, follow the uploaded reference image for case geometry, case color, transparency, and material finish.`;

  const mainPrompt = `${SHARPNESS_LOCK}\n\n${streakLock}${cornerLock}${colorLock}Create a premium ${gridLayout} ecommerce collage for "${phoneModel}" using the uploaded reference image as the non-negotiable case template.

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
