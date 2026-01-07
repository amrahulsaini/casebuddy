/**
 * API Route: /tool/api/generate
 * Generates 5 grid images with AI-powered mockups
 */

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import {
  callGemini,
  buildAnalysisPrompt,
  ANGLE_DESCRIPTIONS,
} from '@/lib/gemini';
import { StreamWriter } from '@/lib/stream-helpers';
import { logAPIUsage } from '@/lib/pricing';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-2.0-flash';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';
const IMAGE_ENHANCE_MODEL = process.env.IMAGE_ENHANCE_MODEL || 'gemini-3-pro-image-preview';

function sanitizeFileName(name: string) {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function extensionFromMime(mimeType: string | undefined) {
  const type = (mimeType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  return 'jpg';
}

// Case-type-specific prompt builder
function buildCaseTypePrompt(
  caseType: string,
  phoneModel: string,
  finalPrompt: string,
  angleListText: string
): string {
  // Base instructions that apply to all case types
  const baseInstructions = 
    `CRITICAL INSTRUCTION: Generate product images of the EXACT ${phoneModel} phone model inserted into the EXACT case from the reference image. Do not substitute phone models or change case design. ` +
    finalPrompt +
    ` Create a SINGLE ultra-realistic, 4K HIGH-RESOLUTION (minimum 3840x2160 pixels) Amazon-style product render that contains five separate views of the ${phoneModel} phone inside the case from the reference image, arranged in a clean grid or collage. ` +
    'QUALITY REQUIREMENTS: Crystal-clear sharpness, no blur or artifacts, perfect focus on all details especially camera lenses and textures, 300 DPI print-ready quality, vibrant colors with smooth gradients, professional studio lighting with realistic shadows and reflections. ' +
    `MANDATORY PHONE MODEL: Every shot must show the ${phoneModel} phone - do not use generic phones or substitute models. The ${phoneModel} must be recognizable and accurate to the actual device specifications. `;

  let specificInstructions = '';

  switch (caseType) {
    case 'transparent':
      // TODO: Custom prompt for transparent cases will be provided later
      specificInstructions =
        'TRANSPARENCY HANDLING: This is a TRANSPARENT/CLEAR case. The phone body, color, components, internal design, and branding MUST be FULLY VISIBLE through the transparent material. Show the phone\'s actual color and design through the clear case. The case material should have realistic transparency with subtle reflections and light refractions typical of clear TPU/silicone. DO NOT make the case opaque or black. ' +
        `CASE ACCURACY: The transparent case must match the reference image EXACTLY - same transparency level, material finish (glossy/matte), and cutout positions. Showcase how the ${phoneModel}'s design is enhanced and protected by the clear case. `;
      break;

    case 'doyers':
      // TODO: Custom prompt for Doyers printed cases will be provided later
      specificInstructions =
        'PRINTED DESIGN CASE: This case features a printed design/pattern on its surface. Preserve the EXACT design, colors, patterns, and artwork from the reference image with PERFECT accuracy. Do not modify, shift, or reinterpret the printed design. ' +
        'DESIGN FIDELITY: The printed graphics must remain crisp, vibrant, and perfectly aligned across all angles. Show how the design wraps around the case edges naturally. Maintain color accuracy and detail sharpness of all printed elements. ' +
        'MATERIAL RENDERING: Render the case material (likely glossy or matte finish) with the printed design sitting on top, showing appropriate texture and finish quality. ';
      break;

    case 'black':
      // TODO: Custom prompt for black bumper cases will be provided later
      specificInstructions =
        'BLACK BUMPER CASE: This is a solid BLACK protective bumper case. The case should be rendered with deep, rich black color - not gray or faded. ' +
        'MATERIAL QUALITY: Show premium black material finish (matte or glossy TPU/silicone) with subtle texture details. Capture realistic light interactions - black cases absorb light but should show form definition through subtle highlights and shadows. ' +
        'PROTECTION FOCUS: Emphasize the protective bumper design, raised edges for screen protection, reinforced corners, and precise button cutouts. The black color should contrast beautifully with the phone\'s design visible through camera cutouts. ';
      break;

    default:
      specificInstructions =
        'CASE ACCURACY: The case must match the reference image EXACTLY - same color, material, transparency, and cutout positions. Do not modify or reinterpret the case design. ';
  }

  const commonEnding =
    'Each tile or panel inside this single image must correspond to the following camera angle descriptions: ' +
    angleListText +
    ` All tiles must preserve identical phone proportions and the exact case geometry from the reference image, including camera island shape and the precise number and layout of circular openings. The ${phoneModel} phone body must always stay fully inside the case outline wherever the phone appears. The phone must fit the case perfectly as if it was designed specifically for the ${phoneModel}. ` +
    'RENDERING QUALITY: Use maximum detail level, ray-traced lighting, photorealistic materials (TPU softness, silicone texture, glass reflections, transparent clarity for clear cases, matte/glossy finish for opaque cases), perfect geometric accuracy, no distortion or warping.';

  return baseInstructions + specificInstructions + commonEnding;
}

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const writer = new StreamWriter(controller);
      const sessionId = uuidv4();
      const startTime = Date.now();
      let logId: number | null = null;

      try {
        if (!GEMINI_API_KEY) {
          throw new Error('API Key not configured');
        }

        // Get user ID from cookie
        const userIdCookie = request.cookies.get('casetool_user_id');
        const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

        const formData = await request.formData();
        const phoneModel = (formData.get('phone_model') as string) || 'Unknown Model';
        const caseImage = formData.get('case_image') as File;
        const reusePrompt = formData.get('reuse_prompt') as string | null;
        const imageModel = (formData.get('image_model') as string) || 'normal';
        const caseType = (formData.get('case_type') as string) || 'transparent';
        
        // Select model based on user choice
        const selectedImageModel = imageModel === 'high' ? IMAGE_ENHANCE_MODEL : IMAGE_MODEL;

        if (!caseImage) {
          throw new Error('Image upload failed');
        }

        // 1. Read uploaded image
        writer.send('status', 'Processing upload...', 10);
        const arrayBuffer = await caseImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imgB64 = buffer.toString('base64');

        // Persist uploaded image so gallery can link to it
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'casetool');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
          console.log('Created uploads directory:', uploadsDir);
        }

        const originalBaseName = sanitizeFileName(caseImage.name || 'upload');
        const hasExt = /\.[a-z0-9]{2,5}$/i.test(originalBaseName);
        const ext = hasExt ? '' : `.${extensionFromMime(caseImage.type)}`;
        const originalFileName = `${sessionId}_${Date.now()}_${originalBaseName}${ext}`;
        const originalFilePath = join(uploadsDir, originalFileName);
        await writeFile(originalFilePath, buffer);
        const originalImageUrl = `/uploads/casetool/${originalFileName}`;

        // Create initial log entry with user_id (+ optional original_image_url)
        try {
          const [result]: any = await pool.execute(
            'INSERT INTO generation_logs (session_id, user_id, phone_model, original_image_name, original_image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
            [sessionId, userId, phoneModel, caseImage.name, originalImageUrl, 'generating']
          );
          logId = result.insertId;
        } catch (e: any) {
          // Backward-compatible fallback if DB schema isn't migrated yet
          const message = String(e?.message || '');
          if (message.toLowerCase().includes('unknown column') && message.includes('original_image_url')) {
            const [result]: any = await pool.execute(
              'INSERT INTO generation_logs (session_id, user_id, phone_model, original_image_name, status) VALUES (?, ?, ?, ?, ?)',
              [sessionId, userId, phoneModel, caseImage.name, 'generating']
            );
            logId = result.insertId;
          } else {
            throw e;
          }
        }

        let finalPrompt: string;
        let phoneDesc: string;
        let caseDesc: string;

        // Check if we should reuse the previous prompt
        if (reusePrompt) {
          writer.send('status', 'Reusing previous AI prompt...', 25);
          finalPrompt = reusePrompt;
          phoneDesc = 'Reusing previous analysis';
          caseDesc = 'Reusing previous analysis';
          
          // Send prompt reuse info to UI
          writer.send('data_log', 'Reusing previous prompt', 40, {
            phone_model_description: phoneDesc,
            case_description: caseDesc,
            final_generation_prompt: finalPrompt,
            prompt: finalPrompt,
          });
        } else {
          // 2. Analyze image and build final prompt (first time only)
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

          const res = await callGemini(
            `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
            payload,
            GEMINI_API_KEY
          );

          const rawText = res.candidates[0]?.content?.parts[0]?.text || '{}';
          const parsed = JSON.parse(rawText);

          phoneDesc = parsed.phone_model_description || 'Phone description not returned.';
          caseDesc = parsed.case_description || 'Case description not returned.';
          finalPrompt =
            parsed.final_generation_prompt ||
            `Ultra realistic Amazon-style product photos of ${phoneModel} fully inserted in the exact same phone case as the reference image.`;

          // Log text analysis API usage
          if (userId) {
            await logAPIUsage(userId, logId, {
              modelName: TEXT_MODEL,
              operationType: 'text_analysis',
              inputImages: 1,
              outputImages: 0,
              outputTokens: rawText.length / 4, // Rough estimate: 1 token ≈ 4 chars
            });
          }

          // Send analysis to UI
          writer.send('data_log', 'Analysis + master prompt ready', 40, {
            phone_model_description: phoneDesc,
            case_description: caseDesc,
            final_generation_prompt: finalPrompt,
            prompt: finalPrompt,
          });
        }

        // Build angle descriptions text
        const angleListText = ANGLE_DESCRIPTIONS.map((desc, idx) => `${idx + 1}) ${desc}`).join(' ');

        const ts = Date.now();
        const outputDir = join(process.cwd(), 'public', 'output');

        // Ensure output directory exists
        if (!existsSync(outputDir)) {
          await mkdir(outputDir, { recursive: true });
          console.log('Created output directory:', outputDir);
        } else {
          console.log('Output directory exists:', outputDir);
        }

        let currentProgress = 40;

        // Generate 1 grid image
        writer.send('image_start', `Starting image generation...`, currentProgress);
        
        currentProgress = 70;
        writer.send('status', `Generating mockup image...`, currentProgress);

          // Build prompt based on case type
          const gridPrompt = buildCaseTypePrompt(caseType, phoneModel, finalPrompt, angleListText);

          const imgPayload = {
            contents: [
              {
                role: 'user',
                parts: [
                  { text: gridPrompt },
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
              temperature: 0.2,
              topP: 0.9,
              topK: 40,
              candidateCount: 1,
            },
          };

          const imgRes = await callGemini(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedImageModel}:generateContent`,
            imgPayload,
            GEMINI_API_KEY
          );

          // Find first inlineData (image bytes)
          let genB64: string | null = null;
          const parts = imgRes.candidates[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData?.data) {
              genB64 = p.inlineData.data;
              break;
            }
          }

          if (!genB64) {
            writer.send('error', `Image was generated but no inlineData was returned.`, currentProgress);
            throw new Error('No image data returned');
          }

          // Create filename with phone model (sanitized)
          const sanitizedModel = phoneModel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${sanitizedModel}_${ts}.png`;
          const filePath = join(outputDir, fileName);
          await writeFile(filePath, Buffer.from(genB64, 'base64'));
          console.log('Image saved to:', filePath);

          const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
          const imageUrl = `/output/${fileName}`;

          // Log image generation API usage
          if (userId && logId) {
            await logAPIUsage(userId, logId, {
              modelName: selectedImageModel,
              operationType: 'image_generation',
              inputImages: 1,
              outputImages: 1,
            });
          }

          // Update log with success
          if (logId) {
            await pool.execute(
              'UPDATE generation_logs SET generated_image_url = ?, ai_prompt = ?, generation_time = ?, status = ? WHERE id = ?',
              [imageUrl, finalPrompt, generationTime, 'completed', logId]
            );
          }

          writer.send('image_result', `Mockup image ready`, 90, {
            url: imageUrl,
            title: `${phoneModel} Case Mockup`,
            logId: logId,
          });

        writer.send('done', 'All tasks completed successfully!', 100);
        controller.close();
      } catch (error: any) {
        // Update log with failure
        if (logId) {
          await pool.execute(
            'UPDATE generation_logs SET status = ? WHERE id = ?',
            ['failed', logId]
          );
        }
        writer.send('error', error.message || 'An error occurred', 0);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
