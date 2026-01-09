import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';

async function callGemini(url: string, payload: any, apiKey: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const referenceImage = formData.get('reference_image') as File;
    const phoneModel = formData.get('phone_model') as string;
    const caseType = formData.get('case_type') as string || 'doyers';
    const imageModelSelection = formData.get('image_model') as string || 'normal';

    // Map selection to actual model
    const selectedImageModel = imageModelSelection === 'high' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

    if (!referenceImage || !phoneModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Image-Based Generation: ${phoneModel}, Model: ${selectedImageModel}`);

    // Convert reference image to base64
    const imageBytes = await referenceImage.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString('base64');
    const mimeType = referenceImage.type;

    const generatedImages: any[] = [];

    // Panel prompts
    const panelPrompts = [
      `Use this phone case image as reference. Generate a professional product photo showing TWO ${phoneModel} phones side-by-side with slight overlap on clean white background. LEFT phone shows BACK VIEW with this case design. RIGHT phone shows FRONT DISPLAY with screen on showing "${phoneModel}". Both at slight 3/4 angle. Match the case design, colors, and camera cutouts from the reference image exactly. Professional e-commerce photography style.`,
      
      `Use this phone case image as reference. Generate TWO items side-by-side on dark black background. LEFT: EMPTY CASE ONLY (no phone inside) showing just the protective case hollow and empty. RIGHT: Same case WITH ${phoneModel} phone inside showing phone's actual body/color through transparent parts. Both show back view at 3/4 angle. Match case design and camera cutouts from reference exactly. Professional product comparison photography.`,
      
      `Use this phone case image as reference. Generate JUST ONE SINGLE EMPTY CASE (no phone inside) dramatically CURVED and TWISTED in an S-curve wave position on light white/grey background. The empty case should be bent/curved showing flexibility. Add text "Hybrid Design" at top. Add labels: "Soft TPU edge" and "Tough PC backplane" with tick marks pointing to respective parts. Match case design and camera cutouts from reference exactly. 3D product render style.`,
      
      `Use this phone case image as reference. Generate a lifestyle photo of a natural hand holding ${phoneModel} with this case from BACK VIEW on dark gradient background. Hand grips phone naturally from right side. Add text "Flaunt The Original Look" at top. Match case design and camera cutouts from reference exactly. Professional lifestyle photography.`,
    ];

    // Generate each panel
    for (let i = 0; i < 4; i++) {
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
              {
                text: panelPrompts[i],
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          topK: 40,
          candidateCount: 1,
        },
      };

      const imgRes = await callGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedImageModel}:generateContent`,
        payload,
        GEMINI_API_KEY
      );

      // Extract image data
      let genB64: string | null = null;
      const parts = imgRes.candidates[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          genB64 = p.inlineData.data;
          break;
        }
      }

      if (!genB64) {
        throw new Error(`Panel ${i + 1}: No image data returned`);
      }

      generatedImages.push({
        angle: i,
        name: `Panel ${i + 1}`,
        imageData: `data:image/jpeg;base64,${genB64}`,
      });
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      phone_model: phoneModel,
      case_type: caseType,
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}
