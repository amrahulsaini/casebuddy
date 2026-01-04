# Original AI Prompts Backup - Created Jan 4, 2026

This file contains the exact original prompts used for image generation before modifications.

## Analysis Prompt (buildAnalysisPrompt)

```
You are an expert product photographer and e-commerce prompt engineer.

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
     • material and finish (e.g., matte black soft-touch TPU, flexible silicone)
     • inner soft lining if visible
     • camera block shape and cutouts
     • side buttons, cutouts for ports and speakers
     • thickness and raised lips.
   - Everything must come from what you SEE.

3) "final_generation_prompt":
   - A single long, detailed prompt to generate ultra-realistic Amazon-style product renders where:
     • The ${phoneModel} phone is fully inserted into this exact case (when the shot includes the phone).
     • The phone height/width ratio and camera island position are consistent in every image.
     • The camera island keeps the same shape and size as the reference.
     • The exact number, spacing and layout of circular openings is preserved.
     • Lenses and flash fit perfectly inside openings, no misalignment or deformation.
     • The phone body is always fully inside the case outline; no part of the phone leaves the case boundaries.
   - Global visual style:
     • realistic, sharp, high-resolution
     • bright, clean, Amazon-style backgrounds (mostly light grey or white, simple studio pedestals or soft 3D shapes)
     • strong but soft studio lighting with clear reflections on camera glass and subtle shadows under the phone.
   - Mention that we will generate five e-commerce angles:
     1) combined front-and-back hero shot in one frame (front screen + rear case), main listing style
     2) clean back-only 3/4 studio angle showing camera area clearly
     3) shock-absorbing TPU + soft lining showcase: case open or peeled, inner soft lining visible, with a round zoom circle focusing on the lining texture and a short text label
     4) case alone, bent in the air in a smooth curve to highlight flexibility / hybrid design (NO phone in this shot)
     5) case alone laid flat or slightly tilted, top-down catalog shot that clearly shows all cutouts and edges (NO phone in this shot).

IMPORTANT OUTPUT RULE:
- Return ONLY valid JSON with the three keys:
  "phone_model_description", "case_description", "final_generation_prompt"
- Do NOT include markdown or any text outside the JSON.
```

## Grid Image Generation Prompt

```
finalPrompt + ' Create a SINGLE ultra-realistic, 4K HIGH-RESOLUTION (minimum 3840x2160 pixels) Amazon-style product render that contains five separate views of the case and phone inside one canvas, arranged in a clean grid or collage. ' +
'QUALITY REQUIREMENTS: Crystal-clear sharpness, no blur or artifacts, perfect focus on all details especially camera lenses and textures, 300 DPI print-ready quality, vibrant colors with smooth gradients, professional studio lighting with realistic shadows and reflections. ' +
'Each tile or panel inside this single image must correspond to the following camera angle descriptions: ' +
angleListText +
' All tiles must preserve identical phone proportions and the exact case geometry from the reference image, including camera island shape and the precise number and layout of circular openings. ' +
'The phone body must always stay fully inside the case outline wherever the phone appears. ' +
'RENDERING QUALITY: Use maximum detail level, ray-traced lighting, photorealistic materials (TPU softness, silicone texture, glass reflections), perfect geometric accuracy, no distortion or warping.'
```

## Angle Descriptions Array

```javascript
[
  'Main Amazon-style hero: two phones in one frame, one showing the front display, the other showing the rear case with camera area, standing on a light pedestal. Bright white / light grey studio background, subtle gradient, crisp shadows.',
  'Back-only 3/4 rear view from slightly above, phone standing on a podium, camera cutouts clearly visible and matching the case geometry, clean soft-box lighting, minimal abstract blocks in the background.',
  'Case and phone composition similar to a "Shock-absorbing TPU + Soft Lining" banner: the case is open or slightly peeled from the phone so that the inner soft lining is visible, with a circular zoom-in bubble showing the lining texture and a short headline text like "Shock-absorbing TPU + Soft Lining" at the top. Amazon-style light background, realistic reflections, all camera and case openings still perfectly aligned.',
  'Case alone, no phone inside, bent in a smooth S-curve in mid air to demonstrate flexibility and hybrid design. Light, airy background with soft bokeh circles. Labels like "Soft TPU edge" or "Hybrid Design" are allowed but keep them minimal.',
  'Case alone laid flat or slightly tilted on a light surface, top-down or slight angle, all camera and button cutouts visible, simple white or light grey background, ideal for technical detail image on an Amazon listing.',
]
```
