# CaseTool AI Prompts Documentation

## Overview
This document outlines all AI prompts used in the CaseTool image generation system. The system uses Google's Gemini AI to analyze phone case images and generate high-quality product mockups.

---

## Models Used

### Text Analysis Model
- **Model**: `gemini-2.0-flash`
- **Purpose**: Analyzes uploaded case images and generates detailed descriptions
- **Configuration**: JSON response format

### Image Generation Model
- **Model**: `gemini-2.5-flash-image`
- **Purpose**: Generates ultra-realistic product mockup images
- **Configuration**:
  - Temperature: 0.25 (for consistency)
  - TopP: 0.8
  - TopK: 32

---

## Prompt 1: Image Analysis Prompt

### Purpose
Analyzes the uploaded phone case image to extract geometry details and create a master generation prompt.

### Key Instructions
1. **Geometry Recognition** - Identify case shape, camera cutouts, button positions
2. **Material Analysis** - Describe case material (TPU, silicone, hybrid, etc.)
3. **Camera Island Mapping** - Count and position circular openings accurately
4. **Alignment Rules** - Ensure phone fits 100% inside case boundaries

### Critical Rules
- Reference case image is the ONLY source of truth
- Never invent features not visible in the case (no halo lights, extra sensors, etc.)
- Phone body must fit 100% inside case outline (strict clipping mask rule)
- Count exact number of circular openings in camera area

### Output Structure
```json
{
  "phone_model_description": "Physical description based on case geometry",
  "case_description": "Material, finish, cutouts, thickness details",
  "final_generation_prompt": "Master prompt for image generation"
}
```

### Full Prompt Template
```
You are an expert product photographer and e-commerce prompt engineer.

You will receive:
- A single reference photo of a PHONE CASE.
- A text label for the target phone model: "{phoneModel}".

CRITICAL GEOMETRY RULES:
1) The REFERENCE CASE IMAGE is the ONLY source of truth for:
   - overall phone aspect ratio (height vs width)
   - camera island shape and size
   - number of circular openings
   - layout (grid / vertical / diagonal pattern)
   - exact position of the camera island on the back
2) Completely IGNORE any catalog or world knowledge about "{phoneModel}" if it conflicts
3) Never invent halo lights, extra LED rings, extra sensors, or decorations
4) Describe cameras ONLY in terms of physical circular/pill openings visible in case
5) ABSOLUTE ALIGNMENT RULE: Phone body must fit 100% inside case inner silhouette

Output STRICT JSON with three fields:
{
  "phone_model_description": "...",
  "case_description": "...",
  "final_generation_prompt": "..."
}
```

---

## Prompt 2: Image Generation Prompt

### Purpose
Generates a single high-resolution composite image containing 5 different product angles.

### Base Prompt Structure
```
{final_generation_prompt from analysis} + 

Create a SINGLE ultra-realistic, high-resolution Amazon-style product render 
containing five separate views arranged in a clean grid or collage.
```

### Five Required Angles

#### Angle 1: Hero Shot (Front + Back)
```
Main Amazon-style hero: two phones in one frame, one showing the front display, 
the other showing the rear case with camera area, standing on a light pedestal. 
Bright white/light grey studio background, subtle gradient, crisp shadows.
```

#### Angle 2: Back 3/4 View
```
Back-only 3/4 rear view from slightly above, phone standing on a podium, 
camera cutouts clearly visible and matching the case geometry, clean soft-box 
lighting, minimal abstract blocks in the background.
```

#### Angle 3: TPU Lining Showcase
```
Case and phone composition showing "Shock-absorbing TPU + Soft Lining": 
case is open or slightly peeled from the phone so inner soft lining is visible, 
with a circular zoom-in bubble showing lining texture and headline text like 
"Shock-absorbing TPU + Soft Lining" at the top. Amazon-style light background, 
realistic reflections, all camera and case openings perfectly aligned.
```

#### Angle 4: Flexibility Demo (Case Only)
```
Case alone, no phone inside, bent in a smooth S-curve in mid air to demonstrate 
flexibility and hybrid design. Light, airy background with soft bokeh circles. 
Labels like "Soft TPU edge" or "Hybrid Design" allowed but minimal.
```

#### Angle 5: Flat Technical View (Case Only)
```
Case alone laid flat or slightly tilted on a light surface, top-down or slight 
angle, all camera and button cutouts visible, simple white or light grey background, 
ideal for technical detail image on an Amazon listing.
```

### Visual Style Requirements
- **Resolution**: 4K quality (3840x2160 or higher)
- **Lighting**: Studio lighting with soft shadows
- **Background**: Clean white or light grey Amazon-style
- **Reflections**: Clear reflections on camera glass
- **Shadows**: Subtle, realistic drop shadows
- **Sharpness**: Crystal clear, no blur or artifacts

### Geometry Constraints
- All tiles preserve identical phone proportions
- Exact case geometry from reference image maintained
- Camera island shape and circular openings match perfectly
- Phone body always fully inside case outline
- No floating or misaligned elements

---

## Prompt 3: Bounding Box Detection (Auto-Crop)

### Purpose
Detects individual product shots within the generated composite image for automatic cropping.

### Instructions
- Find 2-8 distinct sub-images in the composite
- Return tight-fitting bounding boxes for each
- Use normalized coordinates (0-1 range)
- No overlapping boxes
- Each sub-image isolated

### Output Structure
```json
{
  "regions": [
    { "id": 1, "label": "angle_1", "x": 0.0, "y": 0.0, "width": 0.5, "height": 0.5 },
    { "id": 2, "label": "angle_2", "x": 0.5, "y": 0.0, "width": 0.5, "height": 0.5 }
  ]
}
```

---

## Generation Configuration

### Text Analysis Settings
```json
{
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

### Image Generation Settings
```json
{
  "generationConfig": {
    "temperature": 0.25,
    "topP": 0.8,
    "topK": 32
  }
}
```

---

## Quality Metrics

### Target Specifications
- **Image Resolution**: 4K (3840x2160) minimum
- **File Format**: PNG with transparency support
- **Color Space**: sRGB
- **Bit Depth**: 24-bit or 32-bit (with alpha)
- **Compression**: Lossless PNG compression
- **DPI**: 300 DPI for print-ready quality

### Visual Quality Checklist
- ✅ Sharp details in camera lenses
- ✅ Clear text labels readable at full size
- ✅ Smooth gradients without banding
- ✅ Realistic material textures (TPU, silicone)
- ✅ Accurate shadows and reflections
- ✅ No artifacts or noise
- ✅ Consistent lighting across all angles
- ✅ Perfect geometric alignment

---

## API Usage Tracking

### Logged Operations
1. **Text Analysis** - Phone/case description generation
2. **Image Generation** - Each 5-angle mockup created

### Metrics Tracked
- Model name used
- Operation type
- Input images count
- Output images count
- Output tokens (text analysis)
- Generation time
- Success/failure status

---

## Best Practices

### For Optimal Results
1. Upload high-quality case reference images (1080p+)
2. Ensure good lighting in reference photo
3. Use clear, unobstructed view of camera cutouts
4. Avoid heavily branded or decorated cases
5. Provide accurate phone model names
6. Review generated images for geometry accuracy

### Prompt Reuse Feature
- System stores the "final_generation_prompt" from analysis
- Users can regenerate with same prompt (saves API calls)
- Ensures consistency across multiple generations
- Bypasses analysis step for faster processing

---

## Error Handling

### Common Issues
- **No image data returned**: Check API key and model availability
- **Geometry misalignment**: Reference image may have poor quality
- **Missing cutouts**: Camera island not clearly visible in reference
- **Low quality output**: Increase resolution requirements in prompt

### Resolution Steps
1. Verify GEMINI_API_KEY is set
2. Check model names are correct
3. Ensure reference image is high quality
4. Review prompt for conflicting instructions
5. Check API usage limits

---

## Version History

### v1.0 (Current)
- Initial documentation
- Gemini 2.0-flash for text analysis
- Gemini 2.5-flash-image for image generation
- 5-angle composite generation
- 4K quality output

---

## Future Improvements

### Planned Enhancements
- [ ] 8K resolution support
- [ ] Custom angle selection
- [ ] Batch processing multiple cases
- [ ] Style transfer options
- [ ] Background customization
- [ ] Watermark integration
- [ ] Video mockup generation

---

**Last Updated**: December 4, 2025
**Maintained By**: CaseTool Development Team
