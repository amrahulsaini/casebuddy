import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Phone model database with camera specs
const PHONE_SPECS: { [key: string]: { cameras: number; layout: string; position: string; flash: boolean } } = {
  'moto edge 50 fusion': { cameras: 2, layout: 'vertical', position: 'top-left', flash: true },
  'moto edge fusion 50': { cameras: 2, layout: 'vertical', position: 'top-left', flash: true },
  'iphone 15 pro': { cameras: 3, layout: 'triangular', position: 'top-left', flash: true },
  'samsung galaxy s24': { cameras: 3, layout: 'vertical', position: 'top-left', flash: true },
  'vivo v60': { cameras: 2, layout: 'vertical', position: 'top-left', flash: true },
  'vivo t4 pro': { cameras: 2, layout: 'vertical', position: 'top-left', flash: true },
  // Add more models as needed
};

function getPhoneSpecs(modelName: string) {
  const normalized = modelName.toLowerCase().trim();
  return PHONE_SPECS[normalized] || { cameras: 2, layout: 'vertical', position: 'top-left', flash: true };
}

function buildCameraPrompt(specs: { cameras: number; layout: string; position: string; flash: boolean }) {
  let prompt = `CRITICAL CAMERA SPECIFICATIONS - DO NOT DEVIATE:
- EXACTLY ${specs.cameras} camera cutouts/holes in the case
- Camera position: ${specs.position} corner of the phone
- Camera layout: ${specs.layout} arrangement`;
  
  if (specs.flash) {
    prompt += `\n- PLUS 1 small LED flash/torch cutout adjacent to cameras`;
  }
  
  prompt += `\n- DO NOT add extra cameras
- DO NOT generate ${specs.cameras + 1}, ${specs.cameras + 2}, or more camera holes
- Maintain EXACTLY ${specs.cameras} camera cutouts as specified
- Each camera cutout should be circular with raised protective ring around it\n\n`;
  
  return prompt;
}

function buildPanelPrompt(panelNumber: number, caseType: string, cameraPrompt: string, phoneModel: string) {
  const baseStyle = caseType === 'doyers' 
    ? 'BLACK MATTE FRAME with CRYSTAL CLEAR TRANSPARENT CENTER' 
    : caseType === 'transparent' 
    ? 'FULLY TRANSPARENT CLEAR CASE' 
    : 'FULLY BLACK MATTE CASE';

  switch (panelNumber) {
    case 1:
      return `${cameraPrompt}PANEL 1 - PRODUCT HERO SHOT:
Generate TWO phones side-by-side with slight overlap on CLEAN WHITE BACKGROUND.

LEFT PHONE (Back View):
- Shows BACK of phone with case installed
- ${baseStyle}
- Camera cutouts visible matching the EXACT specs above
- Phone branding visible through transparent areas (if applicable)
- Slight 3/4 angle (15-20 degree tilt)

RIGHT PHONE (Front View):
- Shows FRONT screen with display on
- Display text: "${phoneModel}"
- Matching slight 3/4 angle

Both phones upright, slightly overlapping, centered, professional product photography, soft shadows, clean white background.`;

    case 2:
      return `${cameraPrompt}PANEL 2 - CASE COMPARISON:
Generate TWO phone cases side-by-side on DARK BLACK BACKGROUND.

LEFT ITEM:
- EMPTY CASE ONLY (no phone inside)
- ${baseStyle}
- Camera cutouts visible matching EXACT specs above
- Appears hollow/empty showing just the case protection
- Back view at 3/4 angle

RIGHT ITEM:
- CASE WITH PHONE INSIDE
- ${baseStyle}
- Phone's actual color/body visible through transparent areas
- Camera cutouts matching EXACT specs above
- Back view at matching 3/4 angle

Both items upright on reflective dark surface, dramatic lighting, professional comparison shot.`;

    case 3:
      return `${cameraPrompt}PANEL 3 - HYBRID DESIGN SHOWCASE:
Generate JUST ONE SINGLE EMPTY CASE (NO PHONE INSIDE) in dramatic curved/twisted position on LIGHT BACKGROUND.

WHAT TO GENERATE:
- ONE EMPTY CASE ONLY (not a phone, just the protective case)
- ${baseStyle}
- Case is BENT/CURVED in S-curve wave showing flexibility
- Camera cutouts visible matching EXACT specs above
- Floating/suspended in 3D space
- Shows case construction and hybrid design

TEXT OVERLAYS:
- "Hybrid Design" text at top
- Label: "Soft TPU edge" pointing to frame
- Label: "Tough PC backplane" pointing to back panel

Clean white/grey gradient background, soft shadows, 3D product render style.`;

    case 4:
      return `${cameraPrompt}PANEL 4 - LIFESTYLE SHOT:
Generate ONE PHONE with case held in natural hand on DARK BACKGROUND.

WHAT TO GENERATE:
- Natural hand holding phone from BACK VIEW
- ${baseStyle}
- Camera cutouts visible matching EXACT specs above
- Phone's actual design visible through transparent areas (if applicable)
- Slight angle showing depth
- Hand on right side gripping naturally

TEXT OVERLAY:
- "Flaunt The Original Look" at top-left

Dark gradient background, studio lighting, professional lifestyle photography.`;

    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const referenceImage = formData.get('reference_image') as File;
    const phoneModel = formData.get('phone_model') as string;
    const caseType = formData.get('case_type') as string || 'doyers';

    if (!referenceImage || !phoneModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get phone specs
    const specs = getPhoneSpecs(phoneModel);
    const cameraPrompt = buildCameraPrompt(specs);

    console.log(`Generating for: ${phoneModel}`);
    console.log(`Camera specs: ${specs.cameras} cameras, ${specs.layout} layout, ${specs.position}`);

    // Convert reference image to base64
    const imageBytes = await referenceImage.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString('base64');
    const mimeType = referenceImage.type;

    // Generate 4 panels
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const results = [];

    for (let i = 0; i < 4; i++) {
      const panelPrompt = buildPanelPrompt(i + 1, caseType, cameraPrompt, phoneModel);
      
      console.log(`\n=== PANEL ${i + 1} PROMPT ===`);
      console.log(panelPrompt);
      console.log('========================\n');

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a professional product photographer and 3D renderer. Use the provided case image as reference for design, colors, and style.

${panelPrompt}

CRITICAL REQUIREMENTS:
1. Match camera cutouts EXACTLY as specified (${specs.cameras} cameras, ${specs.layout} layout)
2. Match case design and colors from reference image
3. Follow composition instructions precisely
4. Generate professional, high-quality product photography
5. DO NOT add extra cameras or modify camera count

Generate the image now.`,
        },
      ]);

      const response = result.response;
      results.push({
        panel: i + 1,
        success: true,
        data: response.text(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Generated 4 panels for ${phoneModel}`,
      phone_specs: specs,
      results: results,
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}
