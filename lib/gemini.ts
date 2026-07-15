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
- Corner shape and how thick/reinforced the corners are (these slim TPU cases usually have only a modest corner reinforcement — do not overstate it)
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
- State that the case GEOMETRY (silhouette, corners, cutouts, camera lip, lip thickness) must match the uploaded reference exactly, and that the case itself is colorless water-clear plastic with no tint, frost, smoke, or shading of its own
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
    'PANEL 1 (Pure white #FFFFFF studio background, no cream or beige tint) — this is ONE single cell containing both phones together as a single photo, do NOT split into separate cells: TWO phones standing perfectly STRAIGHT and upright, facing the camera head-on (no tilt, no 3/4 angle, no leaning), photographed straight-on at eye level. The FRONT phone is centered and fully visible and shows its BACK inside the exact transparent case from reference, revealing the authentic phone body finish through the clear case with cameras matching specs exactly. There is EXACTLY ONE other phone, placed BEHIND it and shifted LEFT, showing its FRONT screen. The two overlap VERY HEAVILY: the front phone hides about three quarters of it. ONLY A NARROW VERTICAL SLIVER of the back phone shows past the LEFT edge of the front phone — that sliver is about ONE QUARTER of a phone width, roughly as wide as the camera module on the front phone, and no wider. The two phones must NOT sit side by side, must NOT each take half the frame, must NOT be separated by a gap, and the back phone must NOT be half visible — it is mostly buried behind the front phone, showing just a thin strip of its screen edge. The RIGHT side of the front phone has NOTHING behind it: just clean empty white background, no second phone and no screen sliver on the right. The visible screen shows realistic front glass, correct bezel and punch-hole or notch, and a tasteful unbranded abstract wallpaper, never blank white or solid black. Both phones share the same scale, lighting, and floor. Do not change case appearance.',

    'PANEL 2 (Pure white #FFFFFF background, no cream or beige tint): The exact EMPTY transparent case from reference, standing upright and shown from its BACK side only, with NO phone inside it — just the bare clear case shell by itself. Preserve case transparency, tint, finish, camera cutout shape and placement exactly, including the RAISED CAMERA-PROTECTION LIP standing proud around the camera opening. Do not insert any phone, do not fill the interior, and do not alter the case. The inside of the shell is empty clear plastic: the pure white background shows straight through it, so the area inside the outline stays exactly the same pure white as the background — no grey body, no tint, no shading, no frosted fill. NO REFLECTION ON THE EMPTY CASE (CRITICAL): the clear shell must be perfectly clean, colorless, anti-glare glass with a completely even, uniform surface. Do NOT paint any diagonal light streak, slanted bright band, glossy sheen, specular highlight, window or softbox reflection, glare patch, milky white haze, or light-to-dark gradient across the panel — the case must never look like it is catching studio light. Light it with flat, even, ON-AXIS FRONTAL illumination (ring light at the camera, or a flatbed scanner look) with NO directional key light and NO side/top/window light, so no angled highlight band can form anywhere on the shell.',
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

  const mainPrompt = `${streakLock}${cornerLock}${colorLock}Create a premium ${gridLayout} ecommerce collage for "${phoneModel}" using the uploaded reference image as the non-negotiable case template.

MASTER CASE ANALYSIS:
${finalPrompt}

GLOBAL HARD CONSTRAINTS:
- HOW TO READ THE REFERENCE PHOTO (READ FIRST — MOST IMPORTANT): The reference is a casual photo of the real physical case being HELD IN A HAND in front of a plain grey/white wall. Everything visible THROUGH the clear case is the photographer's hand and the room behind it — it is NOT part of the case and must NEVER be copied. Specifically IGNORE and DO NOT reproduce: the hand, palm, fingers, fingernails, knuckles, skin tone, arm hair, the grey/white backdrop, the room lighting, any beige/brown/tan/grey tint the skin casts through the plastic, the soft diagonal light-to-dark boundary where the hand ends and the wall begins, and any haze, shading, or gradient created by them. The case's actual material is 100% colorless, untinted, water-clear plastic with nothing behind it. Do NOT render a hand in any panel unless that panel explicitly asks for one.
- TAKE ONLY GEOMETRY FROM THE REFERENCE: The ONLY things to copy from the reference photo are physical shape facts — outer silhouette and proportions, corner shape and thickness, camera opening shape/size/position, the raised camera lip, button cutouts, port cutout, and side lip thickness. Take NOTHING about color, tint, shading, or lighting from the photo, because those come from the hand and the room, not from the case.
- Preserve the case geometry from the reference image exactly: outer silhouette, camera island placement, lens opening sizes, corner radius, button cutouts, and side lip thickness.
- CAMERA PROTECTION LIP (CRITICAL — DO NOT OMIT): The case MUST include its raised camera-protection rim exactly as in the reference: a raised wall/lip of the case material that stands proud around the entire camera module opening and rises ABOVE the lens surface so the lenses never touch a flat surface. Render this raised border clearly with its visible thickness and edge highlight around the cutout. Do NOT flatten it, do NOT omit it, do NOT let the case end flush with the camera island, and do NOT leave the camera module sticking out uncovered past the case. The camera opening must read as a recessed well surrounded by a raised protective ring.
- CORNER FIDELITY (CRITICAL): Match the corners to the reference at exactly the thickness shown — no more, no less. These slim TPU cases have only a MODEST corner reinforcement; if the reference shows a subtle reinforced/air-cushion corner, reproduce it at that same subtle scale. Do NOT exaggerate it into a chunky rugged-armor corner, a fat shock-absorber block, or a bulging bumper, and do NOT add corner bulk the reference does not have. If the reference corners are slim and low-profile, keep them slim.
- THE CASE IS COLORLESS: Reproduce the case as clean, water-clear, completely colorless and untinted plastic. It has no color of its own, no print, no artwork, and no pattern. Any tint or shading you think you see in the reference is the hand behind it — ignore it. Copy shape from the reference, never color or shading.
- Use one identical phone-and-case asset consistently across all panels. Only the viewing angle, crop, or hand pose may change.
- ${phoneFinishLine}
- If the case has transparent, frosted, or open sections, the real phone body must remain visible underneath in its authentic finish. Never replace the visible phone area with flat white, flat black, blank filler, paper inserts, or empty placeholders.
- Any front-facing phone screen must show realistic front glass, correct bezels and cutouts, and a tasteful unbranded abstract wallpaper or dim lockscreen gradient. Never output a blank white screen or a pure black screen.
- WALLPAPER MUST BE ABSTRACT AND UNBRANDED: the on-screen wallpaper is a soft abstract gradient or shape composition ONLY. It must contain NO letters, NO numbers, NO model names or numbers (e.g. "4a", "Pixel", "7"), NO brand logos, NO multi-colour brand marks, NO icons, NO clock, and NO widgets. Never reproduce a manufacturer's marketing/stock wallpaper — invent a neutral abstract one instead.
- ${backgroundGuidance}${clearPanelConstraint}${backColorConstraint}${noWhiteDefaultConstraint}
- Lighting must stay premium and catalog-clean, but still give enough edge separation so transparent materials remain visible.
- ABSOLUTE RULE — NO TEXT ON THE PHONE OR CASE: Do NOT render any phone model name, brand name, manufacturer name, logo, serial number, regulatory text, or any lettering anywhere on the phone body, the case, the screen bezel, or anywhere in the image. This includes text like "Samsung", "iPhone", "Realme", "Redmi", "OnePlus", "Poco", "Vivo", "Oppo", model numbers, or any other identifier. The phone and case surfaces must be completely clean of all text and logos. If the real phone has a brand embossed on the back, do NOT render it — leave that area clean and blank. Violating this rule makes the image unusable.
- Keep every panel visually consistent as if photographed in the same product shoot.

REFERENCE IMAGE PRIORITY:
- If any instruction conflicts with the uploaded reference image, follow the reference image for CASE GEOMETRY ONLY (silhouette, corners, cutouts, camera lip, lip thickness).
- Never follow the reference for color, tint, shading, lighting, or background — the reference is a hand-held snapshot, so those belong to the hand and the room, not the case. Colors, lighting, and background always come from the instructions above.

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
