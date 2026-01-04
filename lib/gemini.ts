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
- A single reference photo of a PHONE CASE.
- A text label for the target phone model: "${phoneModel}".

CRITICAL GEOMETRY RULES:
1) The REFERENCE CASE IMAGE is the ONLY source of truth for:
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

Your output must be STRICT JSON with exactly these three fields:

{
  "phone_model_description": "...",
  "case_description": "...",
  "final_generation_prompt": "..."
}

DETAILS:

1) "phone_model_description":
   - Describe how the PHONE should look once inserted into THIS case:
     • flat or slightly curved edges
     • camera island position and shape (top-left, rectangular / square, etc.)
     • number and arrangement of circular modules matching the cutouts.
   - Treat "${phoneModel}" only as a label; do not use catalog specs or promo names.
   - Do NOT mention any brand features like "Active Halo", etc.

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
     • The ${phoneModel} phone is fully inserted into this exact case (when the shot includes the phone).
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
  'Main Amazon-style hero: two phones in one frame, one showing the front display, the other showing the rear case with camera area, standing on a light pedestal. Bright white / light grey studio background, subtle gradient, crisp shadows. If transparent case: phone design and color must be clearly visible through the case material.',
  'Back-only 3/4 rear view from slightly above, phone standing on a podium, camera cutouts clearly visible and matching the case geometry, clean soft-box lighting, minimal abstract blocks in the background. If transparent case: phone body and branding visible through the clear material.',
  'Case and phone composition similar to a "Shock-absorbing TPU + Soft Lining" banner: the case is open or slightly peeled from the phone so that the inner soft lining is visible, with a circular zoom-in bubble showing the lining texture and a short headline text like "Shock-absorbing TPU + Soft Lining" at the top. Amazon-style light background, realistic reflections, all camera and case openings still perfectly aligned. If transparent case: show the transparency and clarity of the material.',
  'Case alone, no phone inside, bent in a smooth S-curve in mid air to demonstrate flexibility and hybrid design. Light, airy background with soft bokeh circles. Labels like "Soft TPU edge" or "Hybrid Design" are allowed but keep them minimal. Maintain exact case transparency/opacity as per the reference image.',
  'Case alone laid flat or slightly tilted on a light surface, top-down or slight angle, all camera and button cutouts visible, simple white or light grey background, ideal for technical detail image on an Amazon listing. Show true case transparency/opacity - if clear, show light passing through; if opaque, show solid material.',
];
