/**
 * Rebuilds bulk_api_calls (the /casetool/bulk/billing log) from the generated
 * PNG files still on disk in public/output/bulk.
 *
 * SQL deletes never touched the image files, so each generated PNG is proof of
 * one successful image API call. Filenames are `<base>_<epochMillis>.png`, which
 * gives us the model name and the exact time of the call.
 *
 * Usage (run on the server, from the project root):
 *   npx tsx scripts/restore-bulk-billing.ts            # dry run, shows what it would insert
 *   npx tsx scripts/restore-bulk-billing.ts --apply    # actually insert
 *
 * Options:
 *   --model-key=nano     which model these were generated with (default: nano)
 *   --case-type=transparent
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import pool from '../lib/db';
import { ensureBulkTable } from '../lib/bulk-table';
import { getModelByKey, getRateInr } from '../lib/image-pricing';

function arg(name: string, fallback: string) {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const modelKey = arg('model-key', 'nano');
  const caseType = arg('case-type', 'transparent');

  const spec = getModelByKey(modelKey);
  const rate = getRateInr(modelKey);
  const dir = join(process.cwd(), 'public', 'output', 'bulk');

  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.png') && !f.startsWith('src_'));
  } catch {
    console.error(`Cannot read ${dir}. Run this on the server, from the project root.`);
    process.exit(1);
  }

  // `<base>_<epochMillis>.png`
  const rows = files.map(f => {
    const m = f.match(/^(.*)_(\d{10,})\.png$/);
    const base = m ? m[1] : f.replace(/\.png$/, '');
    const ts = m ? Number(m[2]) : null;
    const modelName = base.replace(/_/g, ' ').trim();
    return {
      genFile: f,
      genUrl: `/casetool/api/bulk-file?name=${encodeURIComponent(f)}`,
      modelName,
      fileName: `${modelName}.jpeg`, // original upload name, best-effort
      createdAt: ts ? new Date(ts) : null,
    };
  }).filter(r => r.createdAt) as Array<{
    genFile: string; genUrl: string; modelName: string; fileName: string; createdAt: Date;
  }>;

  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  console.log(`Found ${files.length} generated PNGs -> ${rows.length} recoverable calls`);
  console.log(`Model: ${spec.label} (${spec.id})  Rate: INR ${rate}  Total: INR ${(rows.length * rate).toFixed(2)}`);
  if (rows.length) {
    console.log(`Range: ${rows[0].createdAt.toISOString()}  ->  ${rows[rows.length - 1].createdAt.toISOString()}`);
    console.log('\nFirst 5:');
    rows.slice(0, 5).forEach(r => console.log(`  ${r.createdAt.toISOString()}  ${r.modelName}  ${r.genFile}`));
  }

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to insert these rows.');
    await pool.end();
    return;
  }

  await ensureBulkTable(pool);
  const [existing]: any = await pool.query(
    'SELECT COUNT(*) AS n FROM bulk_api_calls WHERE case_type = ?', [caseType]
  );
  console.log(`\nbulk_api_calls currently has ${existing[0].n} rows for ${caseType}. Inserting ${rows.length}...`);

  let ok = 0;
  for (const r of rows) {
    try {
      await pool.execute(
        `INSERT INTO bulk_api_calls
           (case_type, file_name, model_name, image_model, model_key, model_label,
            cost_inr, status, gen_file, gen_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, ?)`,
        [caseType, r.fileName, r.modelName, spec.id, modelKey, spec.label,
         rate, r.genFile, r.genUrl, r.createdAt]
      );
      ok++;
    } catch (e: any) {
      console.error(`  failed ${r.genFile}: ${e?.message}`);
    }
  }
  console.log(`\nInserted ${ok}/${rows.length} rows. Billing total restored: INR ${(ok * rate).toFixed(2)}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
