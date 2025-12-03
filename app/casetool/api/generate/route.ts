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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-2.0-flash';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';

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

        const formData = await request.formData();
        const phoneModel = (formData.get('phone_model') as string) || 'Unknown Model';
        const caseImage = formData.get('case_image') as File;
        const reusePrompt = formData.get('reuse_prompt') as string | null;

        if (!caseImage) {
          throw new Error('Image upload failed');
        }

        // Create initial log entry
        const [result]: any = await pool.execute(
          'INSERT INTO generation_logs (session_id, phone_model, original_image_name, status) VALUES (?, ?, ?, ?)',
          [sessionId, phoneModel, caseImage.name, 'generating']
        );
        logId = result.insertId;

        // 1. Read uploaded image
        writer.send('status', 'Processing upload...', 10);
        const arrayBuffer = await caseImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imgB64 = buffer.toString('base64');

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

          const gridPrompt =
            finalPrompt +
            ' Create a SINGLE ultra-realistic, high-resolution Amazon-style product render that contains five separate views of the case and phone inside one canvas, arranged in a clean grid or collage. ' +
            'Each tile or panel inside this single image must correspond to the following camera angle descriptions: ' +
            angleListText +
            ' All tiles must preserve identical phone proportions and the exact case geometry from the reference image, including camera island shape and the precise number and layout of circular openings. ' +
            'The phone body must always stay fully inside the case outline wherever the phone appears.';

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
              temperature: 0.25,
              topP: 0.8,
              topK: 32,
            },
          };

          const imgRes = await callGemini(
            `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
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
            'UPDATE generation_logs SET status = ?, feedback_note = ? WHERE id = ?',
            ['failed', error.message, logId]
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
