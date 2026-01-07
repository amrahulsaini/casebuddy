# Case Type-Specific Prompts - TODO

## Overview
The case type selector has been implemented with three options:
1. **Transparent** - Fully clear TPU cases
2. **Doyers** - Black outline/frame with transparent center panel (protective frame + clear back)
3. **Black** - Solid black bumper cases

## Doyers Case Type - DEFINED ✅

**What is a "Doyers" case?**
A Doyers case has a **BLACK PROTECTIVE FRAME/OUTLINE** with a **TRANSPARENT CENTER PANEL**:
- Black edges/bumper wrap around for protection
- Clear/transparent back panel shows the phone's design
- Best of both worlds: protection (black frame) + aesthetics (visible phone)

See reference image for visual example.

## Current Status ✅
- ✅ UI implemented in casetool page with selector buttons
- ✅ Case type parameter passed to API
- ✅ Prompt builder function created with placeholder prompts
- ✅ Original prompt backed up to `ORIGINAL_PROMPTS_BACKUP.md`

## Where to Add Custom Prompts

File: `app/casetool/api/generate/route.ts`
Function: `buildCaseTypePrompt()`
Lines: ~40-110

### Current Placeholder Prompts:

#### 1. Transparent Cases
```typescript
case 'transparent':
  specificInstructions =
    'TRANSPARENCY HANDLING: This is a TRANSPARENT/CLEAR case. The phone body, color, components, internal design, and branding MUST be FULLY VISIBLE through the transparent material. Show the phone\'s actual color and design through the clear case. The case material should have realistic transparency with subtle reflections and light refractions typical of clear TPU/silicone. DO NOT make the case opaque or black. ' +
    `CASE ACCURACY: The transparent case must match the reference image EXACTLY - same transparency level, material finish (glossy/matte), and cutout positions. Showcase how the ${phoneModel}'s design is enhanced and protected by the clear case. `;
  break;
```

**TODO:** Replace with your optimized transparent case prompt

---

#### 2. Doyers (Printed Design Cases)
```typescript
case 'doyers':
  specificInstructions =
    'PRINTED DESIGN CASE: This case features a printed design/pattern on its surface. Preserve the EXACT design, colors, patterns, and artwork from the reference image with PERFECT accuracy. Do not modify, shift, or reinterpret the printed design. ' +
    'DESIGN FIDELITY: The printed graphics must remain crisp, vibrant, and perfectly aligned across all angles. Show how the design wraps around the case edges naturally. Maintain color accuracy and detail sharpness of all printed elements. ' +
    'MATERIAL RENDERING: Render the case material (likely glossy or matte finish) with the printed design sitting on top, showing appropriate texture and finish quality. ';
  break;
```

**TODO:** Replace with your optimized Doyers case prompt

---

#### 3. Black Bumper Cases
```typescript
case 'black':
  specificInstructions =
    'BLACK BUMPER CASE: This is a solid BLACK protective bumper case. The case should be rendered with deep, rich black color - not gray or faded. ' +
    'MATERIAL QUALITY: Show premium black material finish (matte or glossy TPU/silicone) with subtle texture details. Capture realistic light interactions - black cases absorb light but should show form definition through subtle highlights and shadows. ' +
    'PROTECTION FOCUS: Emphasize the protective bumper design, raised edges for screen protection, reinforced corners, and precise button cutouts. The black color should contrast beautifully with the phone\'s design visible through camera cutouts. ';
  break;
```

**TODO:** Replace with your optimized black case prompt

---

## How to Update Prompts

1. Open file: `app/casetool/api/generate/route.ts`
2. Find function: `buildCaseTypePrompt()`
3. Locate the switch statement with the three case types
4. Replace the `specificInstructions` string for each case type
5. Test each case type to ensure quality

## Prompt Structure

Each case type prompt should include:
- **Material specifics** (transparency, texture, finish)
- **Design handling** (how printed designs or colors should appear)
- **Lighting instructions** (how light interacts with the material)
- **Quality requirements** (sharpness, color accuracy, detail level)
- **Camera/cutout accuracy** (precise geometric matching)

## Testing Checklist

After updating prompts, test each case type with:
- [ ] Transparent case sample
- [ ] Doyers printed design sample
- [ ] Black bumper case sample

Verify:
- [ ] Material rendering is accurate
- [ ] Colors are correct
- [ ] Design details are preserved
- [ ] Phone model is accurate
- [ ] All 5 angles are generated correctly

---

## Notes
- All prompts include the base instructions (phone model accuracy, 5-panel grid, quality requirements)
- The `specificInstructions` variable is what makes each case type unique
- Current placeholders are functional but can be optimized for better results
