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
  return `You are an expert product photographer and e-commerce prompt engineer.

You will receive:
- A single reference photo of a PHONE CASE (just the case, empty or with a phone inside).
- A text label for the target phone model: "${phoneModel}".

YOUR PRIMARY TASK: Generate a prompt that will create product photos showing the EXACT "${phoneModel}" phone inserted into the EXACT case from the reference image. Do not change the phone model or the case design.

CRITICAL GEOMETRY RULES:
1) The REFERENCE CASE IMAGE is the ONLY source of truth for:
   - Case material, color, and transparency (transparent/clear vs opaque/solid)
   - overall phone aspect ratio (height vs width)
   - camera island shape and size
   - number of circular openings
   - layout (grid / vertical / diagonal pattern)
   - exact position of the camera island on the back
2) Completely IGNORE any catalog or world knowledge you may have about "${phoneModel}" hardware if it conflicts with the case geometry.
3) Never invent:
   - halo lights
   - extra LED rings
   - extra sensors
   - extra logos or decorations
   if there is no separate cutout or clear visual hint in the case.
4) When talking about cameras and flash, describe them ONLY in terms of the physical circular / pill openings you see in the case.
5) ABSOLUTE ALIGNMENT RULE:
   - In every image where the phone is inside the case, the phone body must fit 100% inside the inner silhouette of the case.
   - No part of the phone can be outside the case edges.
   - The phone must not float outside or intersect incorrectly with the case.
   - The case outline is treated like a strict clipping mask for the phone.
6) PHONE MODEL MUST BE EXACT:
   - Use EXACTLY "${phoneModel}" as the phone being inserted
   - Do NOT substitute with similar models or generic phones
   - The generated images must show the specific "${phoneModel}" device inside this specific case

Your output must be STRICT JSON with exactly these three fields:

{
  "phone_model_description": "...",
  "case_description": "...",
  "final_generation_prompt": "..."
}

DETAILS:

1) "phone_model_description":
   - Describe how the "${phoneModel}" PHONE should look once inserted into THIS case:
     • Mention it is specifically the "${phoneModel}" model
     • flat or slightly curved edges
     • camera island position and shape (top-left, rectangular / square, etc.)
     • number and arrangement of circular modules matching the cutouts.
   - Treat "${phoneModel}" as the EXACT phone model that must be used - not a generic placeholder.
   - Do NOT mention any brand features like "Active Halo", etc.
   - Do NOT change or substitute the phone model name.

2) "case_description":
   - Describe ONLY the case from the uploaded image:
     • TRANSPARENCY: First, determine if the case is transparent/clear or opaque/solid. If it's transparent, EXPLICITLY state "transparent case" or "clear case" in the description.
     • material and finish (e.g., matte black soft-touch TPU, flexible silicone, transparent TPU, clear case with visible phone inside)
     • For transparent cases: mention that the phone's internal components, design, and color should be visible through the case
     • inner soft lining if visible
     • camera block shape and cutouts
     • side buttons, cutouts for ports and speakers
     • thickness and raised lips.
   - Everything must come from what you SEE.

3) "final_generation_prompt":
   - A single long, detailed prompt to generate ultra-realistic Amazon-style product renders where:
     • MANDATORY: The prompt MUST start with: "Ultra realistic Amazon-style product photos of the ${phoneModel} phone fully inserted into the exact case from the reference image."
     • CRITICAL: Explicitly state this is the "${phoneModel}" model - do not use generic terms like "smartphone" or "mobile phone"
     • The "${phoneModel}" phone is fully inserted into this exact case (when the shot includes the phone).
     • CRITICAL: If the case is transparent/clear, the prompt MUST explicitly state "transparent case" or "clear case" and mention that the phone's body, color, and internal design should be visible through the case material. The phone model "${phoneModel}" must be clearly identifiable through the transparent material.
     • If the case is opaque/solid (black, colored, etc.), explicitly mention the exact color and material (e.g., "matte black TPU case", "dark silicone case").
     • The phone height/width ratio and camera island position are consistent in every image.
     • The camera island keeps the same shape and size as the reference.
     • The exact number, spacing and layout of circular openings is preserved.
     • Lenses and flash fit perfectly inside openings, no misalignment or deformation.
     • The phone body is always fully inside the case outline; no part of the phone leaves the case boundaries.
   - Global visual style:
     • realistic, sharp, high-resolution
     • bright, clean, Amazon-style backgrounds (mostly light grey or white, simple studio pedestals or soft 3D shapes)
     • strong but soft studio lighting with clear reflections on camera glass and subtle shadows under the phone
     • For transparent cases: lighting must show the clarity and transparency of the material, with the ${phoneModel} phone's original design, color, and branding clearly visible through the case
     • For opaque cases: focus on the case material texture, color, and finish.
   - Mention that we will generate five e-commerce angles:
     1) combined front-and-back hero shot in one frame (front screen + rear case), main listing style
     2) clean back-only 3/4 studio angle showing camera area clearly
     3) shock-absorbing TPU + soft lining showcase: case open or peeled, inner soft lining visible, with a round zoom circle focusing on the lining texture and a short text label
     4) case alone, bent in the air in a smooth curve to highlight flexibility / hybrid design (NO phone in this shot)
     5) case alone laid flat or slightly tilted, top-down catalog shot that clearly shows all cutouts and edges (NO phone in this shot).

IMPORTANT OUTPUT RULE:
- Return ONLY valid JSON with the three keys:
  "phone_model_description", "case_description", "final_generation_prompt"
- Do NOT include markdown or any text outside the JSON.`;
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
  'PANEL 1 - AMAZON HERO SHOT: TWO smartphones in PORTRAIT ORIENTATION side-by-side with SLIGHT OVERLAP on CLEAN WHITE BACKGROUND. LEFT PHONE: Shows BACK VIEW in portrait orientation - BLACK FRAME clearly wrapping all edges, TRANSPARENT CENTER showing actual phone color/branding (like "vivo" logo), camera module prominently visible with precise cutouts matching the actual phone model\'s exact camera configuration (position, count, and lens arrangement as per the specified phone model name). RIGHT PHONE: Shows FRONT DISPLAY/SCREEN in portrait orientation with screen facing viewer, displaying phone interface or compatibility text. Both phones in upright portrait position, slightly overlapping at edges, CENTERED in frame. Professional Amazon-style e-commerce studio lighting with soft shadows beneath phones. Clean white/light grey background with subtle gradient. This is the main Amazon product hero image showing complete 360° view - case design on left, screen functionality on right. Case cutouts must perfectly match the exact camera specifications based on the provided phone model name. Material contrast visible: matte black frame vs crystal-clear transparent center vs phone screen. Clean, minimal, professional product photography.',
  'PANEL 2 - DUAL PHONE COMPARISON: TWO phones side-by-side on DARK/BLACK BACKGROUND with dramatic studio lighting. LEFT PHONE: Shows ONLY THE CASE without phone inside - pure BLACK FRAME with crystal clear/transparent center appearing EMPTY like glass, showing the case protection element by itself without any phone visible through it. The transparent center should look like clear glass/crystal with no phone backing visible. RIGHT PHONE: Shows case WITH ACTUAL PHONE INSIDE - BLACK FRAME wrapping edges but TRANSPARENT CENTER clearly reveals the actual phone color/body (like cream, gold, black, blue etc.), phone branding and design fully visible through clear material. Both phones show BACK VIEW at MATCHING 3/4 ANGLE (approximately 25-30 degrees) - PERFECTLY ALIGNED at identical angles and heights. Both positioned upright standing on reflective dark surface at same level. Camera modules visible on both with cutouts matching the actual phone model\'s exact camera configuration based on the provided phone model name (position, count, and arrangement). Gradient lighting from behind creates depth and premium feel. Professional product comparison demonstrating: left = case transparency/clarity alone, right = how real phone looks through case. Realistic shadows and reflections. Symmetrical elegant spacing with both phones at identical tilt angles.',
  'PANEL 3 - HYBRID DESIGN 3D RENDER: SINGLE phone case (the exact uploaded case design) displayed in DRAMATIC CURVED/BENT/TWISTED POSITION floating in 3D space on CLEAN LIGHT BACKGROUND (white to light grey gradient). The actual case with BLACK FRAME and TRANSPARENT CENTER is SIGNIFICANTLY CURVED and BENT like a wave or S-curve showcasing FLEXIBILITY and three-dimensional form. The case appears to be twisting/bending through space demonstrating the flexible hybrid construction of soft edges and rigid back. Shows BACK VIEW with camera cutouts visible matching the actual phone model\'s exact camera configuration. Large clean text "Hybrid Design" positioned separately at TOP of image (NOT on the case itself) in modern bold font. Simple annotation labels positioned SEPARATELY with minimal dotted lines or tick marks: "Soft TPU edge" pointing to black frame area, "Tough PC backplane" pointing to transparent center area. NO decorative elements, NO circular spheres, NO bubbles - just clean minimal design focusing on the twisted/curved case demonstrating flexibility. Soft shadows beneath the curved case. The case should appear dramatically bent/curved in S-curve or wave position showing both the rigid transparent back and flexible black edges. Professional 3D product render style. Clean, simple, minimalist background.',
  'PANEL 4 - LIFESTYLE HAND SHOT: Professional lifestyle photography showing a natural hand holding the phone from the BACK VIEW at slight angle (approximately 20-25 degrees) on DARK/BLACK GRADIENT BACKGROUND. Hand positioned on right side naturally gripping the phone, fingers visible on sides and bottom edge. Phone ALIGNED at consistent angle showing depth and dimension. BLACK FRAME clearly visible wrapping around edges. TRANSPARENT CENTER prominently displaying the actual phone color, design, and branding through crystal-clear material - emphasizing how the case lets you "Flaunt The Original Look". Camera module sharply in focus with cutouts precisely matching the actual phone model\'s exact camera configuration based on the provided phone model name (position, count, and arrangement of lenses). Studio lighting creates subtle highlights on the transparent center and dramatic shadows on dark background. Natural, realistic hand with proper skin tones and lighting. Title text "Flaunt The Original Look" positioned in top-left area. The shot should emphasize how the Doyers case protects while showcasing the phone\'s original beauty and design through the transparent center. Professional, aspirational lifestyle photography suitable for premium product marketing.',
];

