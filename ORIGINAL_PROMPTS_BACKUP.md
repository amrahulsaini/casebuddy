# ORIGINAL PROMPTS BACKUP
## Created: January 7, 2026
## Purpose: Backup of original prompts before implementing case-type-specific prompts

---

## Original Image Generation Prompt

This is the complete prompt used before implementing case-type-specific variations:

```
CRITICAL INSTRUCTION: Generate product images of the EXACT ${phoneModel} phone model inserted into the EXACT case from the reference image. Do not substitute phone models or change case design. 

${finalPrompt}

Create a SINGLE ultra-realistic, 4K HIGH-RESOLUTION (minimum 3840x2160 pixels) Amazon-style product render that contains five separate views of the ${phoneModel} phone inside the case from the reference image, arranged in a clean grid or collage.

QUALITY REQUIREMENTS: Crystal-clear sharpness, no blur or artifacts, perfect focus on all details especially camera lenses and textures, 300 DPI print-ready quality, vibrant colors with smooth gradients, professional studio lighting with realistic shadows and reflections.

MANDATORY PHONE MODEL: Every shot must show the ${phoneModel} phone - do not use generic phones or substitute models. The ${phoneModel} must be recognizable and accurate to the actual device specifications.

TRANSPARENCY HANDLING: If the case is transparent/clear, ensure the phone body, color, components, and branding are FULLY VISIBLE through the transparent material. DO NOT make the case opaque or black if it is supposed to be transparent. For opaque cases, maintain the exact material color and finish from the reference image.

CASE ACCURACY: The case must match the reference image EXACTLY - same color, material, transparency, and cutout positions. Do not modify or reinterpret the case design.

Each tile or panel inside this single image must correspond to the following camera angle descriptions: ${angleListText}

All tiles must preserve identical phone proportions and the exact case geometry from the reference image, including camera island shape and the precise number and layout of circular openings. The ${phoneModel} phone body must always stay fully inside the case outline wherever the phone appears. The phone must fit the case perfectly as if it was designed specifically for the ${phoneModel}.

RENDERING QUALITY: Use maximum detail level, ray-traced lighting, photorealistic materials (TPU softness, silicone texture, glass reflections, transparent clarity), perfect geometric accuracy, no distortion or warping.
```

---

## Variables Used:
- `${phoneModel}` - The specific phone model (e.g., "iPhone 15 Pro Max")
- `${finalPrompt}` - AI-generated master prompt from text analysis step
- `${angleListText}` - Predefined camera angles for the 5-panel collage

---

## Angle Descriptions (From lib/gemini.ts):

1. Panel 1 (Hero): phone inserted, back-facing 3/4 rear angle, centered, clean studio background. Focus on camera cutouts and perfect fit.
2. Panel 2 (Back straight-on): phone inserted, perfectly straight-on back view, full case visible, maximum geometric accuracy.
3. Panel 3 (Camera macro): close-up crop of camera island and surrounding case, show lenses perfectly centered in openings.
4. Panel 4 (Side buttons): close-up of side edge showing button cutouts and thickness, no distortion.
5. Panel 5 (Flat lay): case + phone inserted OR case alone flat lay (choose the most realistic), top-down technical clarity.

---

## Implementation Location:
File: `app/casetool/api/generate/route.ts`
Lines: ~210-230

---

## Notes:
- This prompt was used for ALL case types (transparent, black bumper, regular cases)
- Temperature: 0.2
- TopP: 0.9
- TopK: 40
- Model: gemini-2.5-flash-image (or gemini-3-pro-image-preview for high quality)
