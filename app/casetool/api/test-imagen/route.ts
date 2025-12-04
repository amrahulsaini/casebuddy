/**
 * API Route: /casetool/api/test-imagen
 * Test endpoint for Google Imagen 4.0 models
 */

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import { callGemini, buildAnalysisPrompt, ANGLE_DESCRIPTIONS } from '@/lib/gemini';
import { StreamWriter } from '@/lib/stream-helpers';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-2.0-flash';

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const writer = new StreamWriter(controller);
      const sessionId = uuidv4();
      const startTime = Date.now();

      try {
        if (!GEMINI_API_KEY) {
          throw new Error('API Key not configured');
        }

        const formData = await request.formData();
        const phoneModel = (formData.get('phone_model') as string) || 'Unknown Model';
        const caseImage = formData.get('case_image') as File;
        const imagenModel = (formData.get('imagen_model') as string) || 'imagen-4.0-generate-001';

        if (!caseImage) {
          throw new Error('Image upload failed');
        }

        // 1. Read uploaded image
        writer.send('status', 'Processing upload...', 10);
        const arrayBuffer = await caseImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imgB64 = buffer.toString('base64');

        // 2. Analyze image using Gemini text model
        writer.send('status', 'AI analyzing geometry & building master prompt...', 25);

        const analysisPrompt = buildAnalysisPrompt(phoneModel);

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: analysisPrompt },
                {
                  inlineData: {
                    mimeType: caseImage.type || 'image/jpeg',
                    data: imgB64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        };

        const analysisRes = await callGemini(
          `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
          payload,
          GEMINI_API_KEY
        );

        const rawText = analysisRes.candidates[0]?.content?.parts[0]?.text || '{}';
        const parsedData = JSON.parse(rawText);
        const phoneDesc = parsedData.phone_model_description || 'Unknown device';
        const caseDesc = parsedData.case_description || 'Phone case';

        const finalPrompt =
          `You are an expert product photographer creating an ultra-realistic, Amazon-style product image for: ${phoneDesc}. ` +
          `The case design is: ${caseDesc}. ` +
          `Show this exact case design on the phone as it would appear when actually installed.`;

        writer.send('status', 'Analysis complete, building prompt...', 40);

        // 3. Build angle descriptions text
        const angleListText = ANGLE_DESCRIPTIONS.map((desc, idx) => `${idx + 1}) ${desc}`).join(' ');

        // 4. Build the grid prompt using same system as main casetool
        const gridPrompt =
          finalPrompt +
          ' Create a SINGLE ultra-realistic, 4K HIGH-RESOLUTION (minimum 3840x2160 pixels) Amazon-style product render that contains five separate views of the case and phone inside one canvas, arranged in a clean grid or collage. ' +
          'QUALITY REQUIREMENTS: Crystal-clear sharpness, no blur or artifacts, perfect focus on all details especially camera lenses and textures, 300 DPI print-ready quality, vibrant colors with smooth gradients, professional studio lighting with realistic shadows and reflections. ' +
          'Each tile or panel inside this single image must correspond to the following camera angle descriptions: ' +
          angleListText +
          ' All tiles must preserve identical phone proportions and the exact case geometry from the reference image, including camera island shape and the precise number and layout of circular openings. ' +
          'The phone body must always stay fully inside the case outline wherever the phone appears. ' +
          'RENDERING QUALITY: Use maximum detail level, ray-traced lighting, photorealistic materials (TPU softness, silicone texture, glass reflections), perfect geometric accuracy, no distortion or warping.';

        writer.send('status', `Generating with ${imagenModel}...`, 60);

        // 5. Initialize Google Gen AI and generate images
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const response = await ai.models.generateImages({
          model: imagenModel,
          prompt: gridPrompt,
          config: {
            numberOfImages: 1, // Generate 1 image for testing
          },
        });

        writer.send('status', 'Saving generated images...', 80);

        // 6. Save generated images
        const ts = Date.now();
        const outputDir = join(process.cwd(), 'public', 'output');

        if (!existsSync(outputDir)) {
          await mkdir(outputDir, { recursive: true });
        }

        const generatedImages = [];
        let idx = 1;
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
          throw new Error('No images generated');
        }
        
        for (const generatedImage of response.generatedImages) {
          const imgBytes = generatedImage.image.imageBytes;
          const imageBuffer = Buffer.from(imgBytes, 'base64');
          
          const sanitizedModel = phoneModel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${sanitizedModel}_imagen_${ts}_${idx}.png`;
          const filePath = join(outputDir, fileName);
          
          await writeFile(filePath, imageBuffer);
          
          const imageUrl = `/output/${fileName}`;
          generatedImages.push({
            url: imageUrl,
            title: `${phoneModel} - Image ${idx}`,
          });
          
          idx++;
        }

        // 7. Send results
        writer.send('status', 'Processing complete!', 90);

        for (const img of generatedImages) {
          writer.send('image_result', `Image ready`, 95, img);
        }

        const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
        writer.send('status', `Completed in ${generationTime}s`, 100);
        writer.send('done', 'All tasks completed successfully!', 100);
        
        controller.close();
      } catch (error: any) {
        console.error('Generation error:', error);
        writer.send('error', error.message || 'An unexpected error occurred', 0);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
