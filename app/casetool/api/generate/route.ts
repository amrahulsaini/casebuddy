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
  getAngleDescriptions,
} from '@/lib/gemini';
import { StreamWriter } from '@/lib/stream-helpers';
import { logAPIUsage } from '@/lib/pricing';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3-pro-preview';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';
const IMAGE_ENHANCE_MODEL = process.env.IMAGE_ENHANCE_MODEL || 'gemini-3-pro-image-preview';
const IMAGE_NANO_MODEL = process.env.IMAGE_NANO_MODEL || 'gemini-3.1-flash-image-preview';

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
  angleListText: string,
  backColor: string = ''
): string {
  // Matte case only needs 2 panels (1x2 horizontal layout)
  const gridLayout = caseType === 'matte' || caseType === 'transparent' ? '2-panel grid (1x2 horizontal layout)' : '4-panel grid (2x2)';

  const backgroundGuidance =
    caseType === 'transparent' || caseType === 'doyers'
      ? 'Use a clean pure white studio background (#FFFFFF, plain white, no cream, no beige, no warm tint, no grey, no gradient). Keep the white neutral and true white, and use soft edge lighting so transparent sections stay readable against the white.'
      : 'Use a clean premium light-neutral studio background with enough contrast to define the product. Avoid harsh overexposed white that washes out edges or openings.';

  // For clear/transparent-window cases, the clear panel must NOT tint the phone.
  // It is optically clear glass; the phone's real factory back-panel color shows through.
  const clearPanelConstraint =
    caseType === 'doyers' || caseType === 'transparent'
      ? '\n- CLEAR-PANEL COLOR RULE: Render the transparent area of the case as crystal-clear, colorless, anti-glare glass that shows no reflection streak. The phone body seen through it must keep its REAL original factory back-panel color, fully MATTE and lit by soft even diffuse light so it shows as ONE uniform color across the whole panel — like a flat painted surface, NOT a glossy mirror. Do NOT add a diagonal light streak or bright band, a specular highlight, a glossy sheen, a dark reflection, or a light-to-dark gradient; that reflective sheen/streak is the exact "shade" failure to avoid. Light the product with flat, even, ON-AXIS FRONTAL illumination (like a ring light at the camera or a flatbed scanner), with NO directional key light and NO side/top/window light, so no angled or diagonal highlight band can form. Keep it even, uniform, and true to the real color, with zero bright spots and never darkened toward black.'
      : '';

  // When the seller specifies the exact back-panel color, force a solid even fill of
  // that color through the clear window. This overrides color guessing and kills the
  // smoky-grey gradient (a solid fill leaves no room for a shade).
  const trimmedBackColor = backColor.trim();
  const backColorConstraint =
    trimmedBackColor && (caseType === 'doyers' || caseType === 'transparent')
      ? `\n- BACK PANEL COLOR OVERRIDE (MANDATORY, HIGHEST PRIORITY): Paint the phone's entire back panel as ONE FLAT, FULLY MATTE, UNIFORM block of "${trimmedBackColor}" — the exact same "${trimmedBackColor}" color value in every pixel, edge to edge, like a flat painted color chip lit by soft even diffuse light. ABSOLUTELY NO reflections of any kind on the back: NO diagonal light streak or bright band running across it, NO specular highlight, NO glossy sheen, NO window or softbox reflection, NO glare, NO light-to-dark gradient, NO smoke, NO grey or black shade. The panel never catches or mirrors studio light anywhere; it stays one even matte "${trimmedBackColor}" color with zero bright spots and zero darker spots. The clear case over it is anti-glare and also shows no reflection streak. Light the whole product with flat, even, ON-AXIS FRONTAL illumination — as if from a ring light at the camera position or a flatbed scanner — with NO directional key light, NO top or side light, and NO window/softbox reflection, so neither the glass nor the back panel ever forms an angled or diagonal highlight band. Use no other color, no pattern, no texture. This overrides any color or finish described anywhere else.`
      : '';

  const hasBackColor = !!trimmedBackColor && (caseType === 'doyers' || caseType === 'transparent');

  // When NO back color is specified, the model keeps defaulting the phone body to
  // plain white/silver/grey. Force a rich saturated factory color instead.
  const noWhiteDefaultConstraint =
    !hasBackColor && (caseType === 'doyers' || caseType === 'transparent')
      ? '\n- PHONE BODY COLOR (MANDATORY): The phone body seen through the clear case must be a rich, saturated, attractive factory color such as deep green, blue, purple, teal, or black. It must NEVER be plain white, silver, light grey, off-white, cream, or any pale/washed-out color. Pick a vivid non-white color and keep it as ONE flat matte uniform fill across the whole back. If the analysis suggests white/silver/grey, override it with a vivid color instead.'
      : '';

  // Stated FIRST so it wins over any finish the analysis invented (e.g. "graphite/black").
  const colorLock = hasBackColor
    ? `TOP-PRIORITY COLOR LOCK — READ THIS FIRST AND OBEY IT ABOVE EVERYTHING BELOW: The phone's back panel must be a solid, uniform, flat "${trimmedBackColor}" in EVERY panel. If anything below — including the MASTER CASE ANALYSIS or any finish description — names a different phone body color or finish (for example black, graphite, gunmetal, titanium, midnight, grey, or silver), treat that as WRONG and use "${trimmedBackColor}" instead. The "${trimmedBackColor}" back panel is mandatory and non-negotiable.\n\n`
    : '';

  // Don't let "keep the same factory finish" re-assert the analysis color.
  const phoneFinishLine = hasBackColor
    ? `Keep the phone back panel a consistent solid "${trimmedBackColor}" in every panel; this color overrides any finish named in the analysis.`
    : 'Keep the same authentic factory phone finish in every panel.';

  // Put the exact color right inside each panel instruction, where the model renders.
  const panelText = hasBackColor
    ? angleListText.replace(/back panel/gi, `back panel (solid uniform ${trimmedBackColor})`)
    : angleListText;

  const mainPrompt = `${colorLock}Create a premium ${gridLayout} ecommerce collage for "${phoneModel}" using the uploaded reference image as the non-negotiable case template.

MASTER CASE ANALYSIS:
${finalPrompt}

GLOBAL HARD CONSTRAINTS:
- Preserve the case geometry from the reference image exactly: outer silhouette, camera island placement, lens opening sizes, corner radius, button cutouts, side lip thickness, and material finish.
- CORNER FIDELITY (CRITICAL): Reproduce the corners EXACTLY as they appear in the reference case — same thinness, same radius, same slim profile. Do NOT thicken, bulge, or round the corners into a chunky raised bumper, rugged armor corner, shock-absorber corner, or reinforced air-cushion corner. If the reference case has slim, low-profile corners, the generated case must keep those exact slim corners. Never add extra corner bulk that is not present in the reference image.
- Copy the case colors, transparency, tint, artwork, and surface texture exactly from the reference image. Do not reinterpret, simplify, recolor, or redesign anything.
- Use one identical phone-and-case asset consistently across all panels. Only the viewing angle, crop, or hand pose may change.
- ${phoneFinishLine}
- If the case has transparent, frosted, or open sections, the real phone body must remain visible underneath in its authentic finish. Never replace the visible phone area with flat white, flat black, blank filler, paper inserts, or empty placeholders.
- Any front-facing phone screen must show realistic front glass, correct bezels and cutouts, and a tasteful unbranded abstract wallpaper or dim lockscreen gradient. Never output a blank white screen or a pure black screen.
- ${backgroundGuidance}${clearPanelConstraint}${backColorConstraint}${noWhiteDefaultConstraint}
- Lighting must stay premium and catalog-clean, but still give enough edge separation so transparent materials remain visible.
- ABSOLUTE RULE — NO TEXT ON THE PHONE OR CASE: Do NOT render any phone model name, brand name, manufacturer name, logo, serial number, regulatory text, or any lettering anywhere on the phone body, the case, the screen bezel, or anywhere in the image. This includes text like "Samsung", "iPhone", "Realme", "Redmi", "OnePlus", "Poco", "Vivo", "Oppo", model numbers, or any other identifier. The phone and case surfaces must be completely clean of all text and logos. If the real phone has a brand embossed on the back, do NOT render it — leave that area clean and blank. Violating this rule makes the image unusable.
- Keep every panel visually consistent as if photographed in the same product shoot.

REFERENCE IMAGE PRIORITY:
- If any instruction conflicts with the uploaded reference image, follow the uploaded reference image for case geometry, case color, transparency, and material finish.

LAYOUT ENFORCEMENT (CRITICAL — THE GRID MUST BE EXACT):
- The output is ONE ${gridLayout} and nothing else. ${gridLayout.startsWith('2') ? 'Exactly TWO equal cells in a single horizontal row.' : 'Exactly FOUR equal cells arranged as 2 rows by 2 columns.'}
- Each cell is the SAME size. Do NOT make any cell larger, do NOT add a big hero/feature panel, and do NOT add a wide left or right banner panel.
- Render EXACTLY one panel per cell, in order: cell 1 = PANEL 1, cell 2 = PANEL 2, cell 3 = PANEL 3, cell 4 = PANEL 4. Do NOT skip a panel, do NOT repeat any panel, and do NOT add extra panels or cells.
- Each text label appears AT MOST ONCE total. Never duplicate "Hybrid Design", "Flaunt The Original Look", or any other label across cells.
- The total cell count must equal exactly ${gridLayout.startsWith('2') ? 'TWO' : 'FOUR'}. No fifth panel, no inset, no collage-within-a-collage.

Create ${gridLayout} with these exact panels:
${panelText}`;

  return mainPrompt;
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
        const backColor = ((formData.get('back_color') as string) || '').trim();
        
        // Select model based on user choice
        const selectedImageModel = imageModel === 'high' ? IMAGE_ENHANCE_MODEL : imageModel === 'nano' ? IMAGE_NANO_MODEL : IMAGE_MODEL;

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
            'INSERT INTO generation_logs (session_id, user_id, phone_model, case_type, original_image_name, original_image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [sessionId, userId, phoneModel, caseType, caseImage.name, originalImageUrl, 'generating']
          );
          logId = result.insertId;
        } catch (e: any) {
          // Backward-compatible fallback if DB schema isn't migrated yet
          const message = String(e?.message || '');
          if (message.toLowerCase().includes('unknown column') && (message.includes('original_image_url') || message.includes('case_type'))) {
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
        } else if (caseType === 'matte') {
          // FOR MATTE CASE: Skip analysis, send direct system prompt with grids
          writer.send('status', 'Preparing direct prompt for matte case...', 25);
          
          phoneDesc = `Phone Model: ${phoneModel}`;
          caseDesc = 'Using reference image directly without analysis';
          finalPrompt = `System Prompt: You are creating a 2-panel product photography layout for a phone case.

Phone Model: ${phoneModel}
Reference Image: The uploaded image shows the EXACT phone case design to use.

Task: Create a 1x2 grid image with 2 panels showing different views of this case without changing its original color or finish.

IMPORTANT: DO NOT RECREATE OR REDESIGN THE CASE. Use the EXACT case from the reference image (same colors, materials, transparency, design).`;

          // Send direct prompt info to UI
          writer.send('data_log', 'Direct matte case prompt (no analysis)', 40, {
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

          // Extract camera specs if available
          const cameraSpecs = parsed.phone_model_camera_specs || null;
          
          phoneDesc = parsed.phone_model_description || 'Phone description not returned.';
          caseDesc = parsed.case_description || 'Case description not returned.';
          finalPrompt =
            parsed.final_generation_prompt ||
            `Ultra realistic Amazon-style product photos of ${phoneModel} fully inserted in the exact same phone case as the reference image.`;

          // Log camera specs to console for debugging
          if (cameraSpecs) {
            console.log('\nRESEARCHED CAMERA SPECS FOR:', phoneModel);
            console.log('Camera Count:', cameraSpecs.rear_camera_count);
            console.log('Torch Light:', cameraSpecs.has_torch_light ? 'Yes' : 'No');
            console.log('Arrangement:', cameraSpecs.camera_arrangement);
            console.log('Island Shape:', cameraSpecs.camera_island_shape);
            console.log('Position:', cameraSpecs.camera_module_position);
            console.log('Lens Sizes:', cameraSpecs.lens_sizes);
            console.log('\n');
          }

          // Log text analysis API usage
          if (userId) {
            await logAPIUsage(userId, logId, {
              modelName: TEXT_MODEL,
              operationType: 'text_analysis',
              inputImages: 1,
              outputImages: 0,
              outputTokens: rawText.length / 4, // Rough estimate: 1 token ~= 4 chars
            });
          }

          // Send analysis to UI (include camera specs)
          writer.send('data_log', 'Analysis + master prompt ready', 40, {
            phone_model_description: phoneDesc,
            case_description: caseDesc,
            final_generation_prompt: finalPrompt,
            prompt: finalPrompt,
            camera_specs: cameraSpecs, // Include specs in the data sent to UI
          });
        }

        // Build angle descriptions text based on case type
        const angleDescriptions = getAngleDescriptions(caseType);
        const angleListText = angleDescriptions.map((desc, idx) => `${idx + 1}) ${desc}`).join(' ');

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

        // Check if matte case type - generate 1 grid image
        if (caseType === 'matte') {
          writer.send('image_start', `Starting matte case generation...`, currentProgress);
          writer.send('status', `Generating matte case mockup image...`, 55);

          // Build 2-panel grid prompt
          const gridPrompt = buildCaseTypePrompt(caseType, phoneModel, finalPrompt, angleListText, backColor);

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
          const matteparts = imgRes.candidates[0]?.content?.parts || [];
          for (const p of matteparts) {
            if (p.inlineData?.data) {
              genB64 = p.inlineData.data;
              break;
            }
          }

          if (!genB64) {
            writer.send('error', `Image was generated but no inlineData was returned.`, 55);
            throw new Error('No image data returned for matte case');
          }

          const sanitizedModel = phoneModel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${sanitizedModel}_${ts}_img1.png`;
          const filePath = join(outputDir, fileName);
          await writeFile(filePath, Buffer.from(genB64, 'base64'));
          console.log('Matte case image saved to:', filePath);

          const imageUrl = `/output/${fileName}`;
          const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

          // Log image generation API usage
          if (userId && logId) {
            await logAPIUsage(userId, logId, {
              modelName: selectedImageModel,
              operationType: 'image_generation',
              inputImages: 1,
              outputImages: 1,
            });
          }

          // Update log
          if (logId) {
            await pool.execute(
              'UPDATE generation_logs SET generated_image_url = ?, ai_prompt = ?, generation_time = ?, status = ? WHERE id = ?',
              [imageUrl, finalPrompt, generationTime, 'completed', logId]
            );
          }

          writer.send('image_result', `Matte case mockup ready`, 90, {
            url: imageUrl,
            title: `${phoneModel} Matte Case`,
            logId: logId,
          });

        } else {
          // Original behavior for non-matte cases: Generate 1 grid image
          writer.send('image_start', `Starting image generation...`, currentProgress);
          
          currentProgress = 70;
          writer.send('status', `Generating mockup image...`, currentProgress);

          // Build prompt based on case type
          const gridPrompt = buildCaseTypePrompt(caseType, phoneModel, finalPrompt, angleListText, backColor);

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
          // No broad pattern, just direct path
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
        }

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
