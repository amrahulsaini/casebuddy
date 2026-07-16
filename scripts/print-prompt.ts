/**
 * Prints the exact prompt sent to the image model, for a given case type.
 * Usage: npx tsx scripts/print-prompt.ts [caseType] [phoneModel] [backColor]
 */
import { getAngleDescriptions, buildCaseTypePrompt } from '../lib/gemini';

const caseType = process.argv[2] || 'transparent';
const phoneModel = process.argv[3] || 'Google Pixel 3';
const backColor = process.argv[4] || '';

const angles = getAngleDescriptions(caseType);
const angleListText = angles.map((d, i) => `${i + 1}) ${d}`).join(' ');
const analysisPlaceholder =
  '<<< MASTER CASE ANALYSIS — generated per image by the analysis step >>>';

console.log(buildCaseTypePrompt(caseType, phoneModel, analysisPlaceholder, angleListText, backColor));
