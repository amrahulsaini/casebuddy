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

CRITICAL PHONE MODEL RESEARCH:
1) FIRST: Research and determine the EXACT camera specifications for "${phoneModel}":
   - How many camera lenses does this specific phone model have? (e.g., 3 cameras, 4 cameras)
   - What is the exact arrangement? (vertical line, square grid, L-shape, circular cluster)
   - What are the lens types and sizes? (main camera, ultra-wide, macro, depth sensor)
   - Where is the camera module positioned on the phone back? (top-left, top-center, etc.)
   - What is the camera island shape for this model? (rectangular, square, circular, pill-shaped)
   - Use your knowledge base to get the ACTUAL specifications of "${phoneModel}"

2) The REFERENCE CASE IMAGE shows you:
   - Case material, color, and transparency (transparent/clear vs opaque/solid)
   - Overall case structure and design
   - Camera cutout area in the case
   
3) YOUR TASK: Describe how the "${phoneModel}"'s REAL camera configuration (from step 1) should fit into the case's camera cutout area (from step 2):
   - The camera count and positions must match the ACTUAL "${phoneModel}" specifications
   - The case cutout should accommodate the real camera layout of this phone model
   - If the case cutout doesn't perfectly match, prioritize the phone's ACTUAL camera specs

4) Never invent fake features:
   - Don't add halo lights, extra LED rings, or decorative elements unless they exist on the real "${phoneModel}"
   - Stick to the actual hardware specifications of "${phoneModel}"

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
   - FIRST: Research the ACTUAL "${phoneModel}" specifications from your knowledge base
   - Describe the REAL camera configuration of "${phoneModel}":
     • EXACT number of camera lenses this model has (e.g., "3-camera system", "4-camera setup")
     • EXACT arrangement pattern (e.g., "vertical triple camera", "square quad camera", "L-shaped layout")
     • EXACT lens types (e.g., "50MP main + 8MP ultra-wide + 2MP macro")
     • EXACT camera island shape for this model (rectangular, square, circular, pill)
     • EXACT position on phone back (top-left corner, top-center, etc.)
   - Then describe how this REAL phone hardware fits into the case:
     • Mention it is specifically the "${phoneModel}" model
     • The phone's actual camera configuration as researched above
     • How the real cameras align with the case's cutout area
   - IMPORTANT: Use the ACTUAL specifications of "${phoneModel}", not what you see in the case
   - The case must accommodate the phone's real hardware, not vice versa

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
     • CRITICAL: Explicitly state this is the "${phoneModel}" model with its ACTUAL camera configuration (the exact number of lenses and their arrangement as you researched)
     • CAMERA SPECIFICATIONS: The prompt MUST include the EXACT camera specs of "${phoneModel}":
       - "The ${phoneModel} features [X] cameras in a [arrangement pattern] with [lens descriptions]"
       - "The camera island is [shape] positioned at [location] on the phone back"
       - "Camera cutouts in the case must precisely match this ${phoneModel}'s actual camera layout"
     • The "${phoneModel}" phone is fully inserted into this exact case (when the shot includes the phone).
     • CRITICAL: If the case is transparent/clear, the prompt MUST explicitly state "transparent case" or "clear case" and mention that the phone's body, color, and internal design should be visible through the case material. The phone model "${phoneModel}" must be clearly identifiable through the transparent material.
     • If the case is opaque/solid (black, colored, etc.), explicitly mention the exact color and material (e.g., "matte black TPU case", "dark silicone case").
     • The camera configuration must match the ACTUAL "${phoneModel}" specifications researched above
     • Lenses must be rendered according to the real "${phoneModel}" hardware specs
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
  'PANEL 1 - AMAZON HERO SHOT (FIXED ANGLE): TWO smartphones positioned side-by-side with SLIGHT OVERLAP on CLEAN WHITE BACKGROUND. MANDATORY ANGLE: Both phones MUST be shown at EXACTLY 3/4 ANGLED VIEW (approximately 15-20 degree tilt from straight-on) - this is NON-NEGOTIABLE and must be EXACTLY like the reference product image style. DO NOT show flat front view, DO NOT show top-down view, DO NOT show side profile - ONLY 3/4 angled view showing depth and dimension. LEFT PHONE: Shows BACK VIEW with case at this EXACT 3/4 angle - For DOYERS cases: BLACK FRAME/BUMPER clearly wrapping all edges with sharp definition, TRANSPARENT CENTER PANEL showing actual phone color/body and branding (like "vivo" logo visible through clear center). CRITICAL CAMERA ACCURACY: The camera module cutout in the BLACK FRAME must EXACTLY match the specified phone model\'s precise camera configuration - analyze the phone model name provided (e.g., "Vivo V60 5G", "Galaxy A35 5G") and render the EXACT number of camera lenses, their EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes (main/ultra-wide/macro/depth), and EXACT spacing as that specific phone model has in reality. DO NOT use generic camera layouts. Research and replicate the actual camera island shape and lens configuration of the named phone model. The camera cutout must be a precise match to that model\'s specifications. RIGHT PHONE: Shows FRONT DISPLAY/SCREEN at MATCHING IDENTICAL 3/4 angle with screen facing viewer, displaying phone model compatibility text clearly readable. CRITICAL: Both phones MUST maintain this EXACT SAME 3/4 TILT ANGLE (15-20 degrees) - they should look like professional product photography with consistent perspective. Phones slightly overlapping at edges, CENTERED in frame, standing upright. Professional Amazon-style e-commerce studio lighting with soft shadows beneath phones. Clean white background with subtle gradient. This is the main Amazon product hero image showing complete 360° view - case design on left, screen functionality on right. For DOYERS cases: Show strong contrast between matte black protective frame edges and crystal-clear transparent center where phone body is visible. The black frame should have sharp, clean boundaries. TRANSPARENT cases: Show full phone visibility through clear material. BLACK cases: Show solid black protective coverage. Material accuracy and phone-specific camera precision are MANDATORY. Clean, minimal, professional product photography. REMEMBER: This angle NEVER changes - ALWAYS 3/4 tilted view showing dimension and depth, exactly like the reference style.',
  'PANEL 2 - DUAL PHONE COMPARISON: TWO phones side-by-side on DARK/BLACK BACKGROUND with dramatic studio lighting. LEFT PHONE: Shows ONLY THE CASE without phone inside - pure BLACK FRAME/BUMPER with crystal clear/transparent center appearing EMPTY like glass, showing the case protection element by itself without any phone visible through it. The transparent center should look like clear glass/crystal with no phone backing visible. Camera cutout in the black frame visible but empty. RIGHT PHONE: Shows case WITH ACTUAL PHONE INSIDE - BLACK FRAME wrapping edges but TRANSPARENT CENTER clearly reveals the actual phone color/body (like cream, gold, black, blue etc.), phone branding and design fully visible through clear material. CRITICAL CAMERA ACCURACY: Camera modules visible with cutouts EXACTLY matching the specified phone model\'s precise camera configuration - analyze the phone model name and render the EXACT number of lenses, EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes, and EXACT spacing as that specific model has. DO NOT use generic layouts. Both phones show BACK VIEW at MATCHING 3/4 ANGLE (approximately 25-30 degrees) - PERFECTLY ALIGNED at identical angles and heights. Both positioned upright standing on reflective dark surface at same level. Gradient lighting from behind creates depth and premium feel. Professional product comparison demonstrating: left = case transparency/clarity alone, right = how real phone looks through case. Realistic shadows and reflections. Symmetrical elegant spacing with both phones at identical tilt angles.',
  'PANEL 3 - HYBRID DESIGN 3D RENDER: JUST ONE SINGLE phone case (the EXACT uploaded case design reference) displayed in DRAMATIC CURVED/BENT/TWISTED POSITION floating in 3D space on CLEAN LIGHT BACKGROUND (white to light grey gradient). ONE CASE ONLY - not two phones, not multiple cases - JUST THE SINGLE CASE SHELL. For DOYERS cases: Show the BLACK FRAME/BUMPER and TRANSPARENT CENTER clearly - the actual case structure with black protective edges and clear center panel. The EMPTY CASE is SIGNIFICANTLY CURVED and BENT like a wave or S-curve showcasing FLEXIBILITY and three-dimensional form. NO PHONE INSIDE, NO CAMERA CUTOUTS VISIBLE - just the pure case structure itself twisted/bending through space demonstrating the flexible hybrid construction. The case appears to float and bend showing the material flexibility of soft edges and rigid back panel. Large clean text "Hybrid Design" positioned separately at TOP of image (NOT on the case itself) in modern bold font. Simple annotation labels positioned SEPARATELY with minimal dotted lines or tick marks: "Soft TPU edge" pointing to black frame area, "Tough PC backplane" pointing to transparent center area. NO decorative elements, NO circular spheres, NO bubbles, NO camera details - just clean minimal design focusing on the single twisted/curved empty case shell demonstrating flexibility. Soft shadows beneath the curved case. The case should appear dramatically bent/curved in S-curve or wave position showing material flexibility. Professional 3D product render style. Clean, simple, minimalist background. EMPHASIS: ONLY ONE SINGLE EMPTY CASE SHELL in twisted form - exactly as provided in reference, no modifications.',
  'PANEL 4 - LIFESTYLE HAND SHOT: Professional lifestyle photography showing a natural hand holding the phone from the BACK VIEW at slight angle (approximately 20-25 degrees) on DARK/BLACK GRADIENT BACKGROUND. Hand positioned on right side naturally gripping the phone, fingers visible on sides and bottom edge. Phone ALIGNED at consistent angle showing depth and dimension. For DOYERS cases: BLACK FRAME/BUMPER clearly visible wrapping around edges with sharp definition. TRANSPARENT CENTER prominently displaying the actual phone color, design, and branding through crystal-clear material - emphasizing how the case lets you "Flaunt The Original Look". CRITICAL CAMERA ACCURACY: Camera module sharply in focus with cutouts in the black frame precisely matching the specified phone model\'s EXACT camera configuration - analyze the phone model name and render the EXACT number of camera lenses, their EXACT positions (vertical/horizontal/diagonal arrangement), EXACT sizes (main/ultra-wide/macro/depth sensors), and EXACT spacing as that specific phone model has in reality. DO NOT use generic camera layouts. The camera cutout must be a precise match to that model\'s specifications. Studio lighting creates subtle highlights on the transparent center and dramatic shadows on dark background. Natural, realistic hand with proper skin tones and lighting. Title text "Flaunt The Original Look" positioned in top-left area. The shot should emphasize how the Doyers case protects while showcasing the phone\'s original beauty and design through the transparent center. Professional, aspirational lifestyle photography suitable for premium product marketing.',
];

