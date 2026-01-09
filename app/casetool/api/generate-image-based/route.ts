import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const referenceImage = formData.get('reference_image') as File;
    const phoneModel = formData.get('phone_model') as string;
    const caseType = formData.get('case_type') as string || 'doyers';

    if (!referenceImage || !phoneModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert reference image to base64
    const imageBytes = await referenceImage.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString('base64');
    const mimeType = referenceImage.type;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const generatedImages: any[] = [];

    // Panel 1: Two phones (back + front)
    const panel1Result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: `Use this phone case image as reference. Generate a professional product photo showing TWO ${phoneModel} phones side-by-side with slight overlap on clean white background. LEFT phone shows BACK VIEW with this case design. RIGHT phone shows FRONT DISPLAY with screen on showing "${phoneModel}". Both at slight 3/4 angle. Match the case design, colors, and camera cutouts from the reference image exactly. Professional e-commerce photography style.`,
      },
    ]);

    generatedImages.push({
      angle: 0,
      name: 'Panel 1 - Hero Shot',
      imageData: panel1Result.response.text(),
    });

    // Panel 2: Case comparison (empty vs with phone)
    const panel2Result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: `Use this phone case image as reference. Generate TWO items side-by-side on dark black background. LEFT: EMPTY CASE ONLY (no phone inside) showing just the protective case hollow and empty. RIGHT: Same case WITH ${phoneModel} phone inside showing phone's actual body/color through transparent parts. Both show back view at 3/4 angle. Match case design and camera cutouts from reference exactly. Professional product comparison photography.`,
      },
    ]);

    generatedImages.push({
      angle: 1,
      name: 'Panel 2 - Comparison',
      imageData: panel2Result.response.text(),
    });

    // Panel 3: Single curved case
    const panel3Result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: `Use this phone case image as reference. Generate JUST ONE SINGLE EMPTY CASE (no phone inside) dramatically CURVED and TWISTED in an S-curve wave position on light white/grey background. The empty case should be bent/curved showing flexibility. Add text "Hybrid Design" at top. Add labels: "Soft TPU edge" and "Tough PC backplane" with tick marks pointing to respective parts. Match case design and camera cutouts from reference exactly. 3D product render style.`,
      },
    ]);

    generatedImages.push({
      angle: 2,
      name: 'Panel 3 - Hybrid Design',
      imageData: panel3Result.response.text(),
    });

    // Panel 4: Lifestyle hand shot
    const panel4Result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: `Use this phone case image as reference. Generate a lifestyle photo of a natural hand holding ${phoneModel} with this case from BACK VIEW on dark gradient background. Hand grips phone naturally from right side. Add text "Flaunt The Original Look" at top. Match case design and camera cutouts from reference exactly. Professional lifestyle photography.`,
      },
    ]);

    generatedImages.push({
      angle: 3,
      name: 'Panel 4 - Lifestyle',
      imageData: panel4Result.response.text(),
    });

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
