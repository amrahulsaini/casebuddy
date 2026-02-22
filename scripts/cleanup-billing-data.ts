/**
 * Script to delete database records and image files until Download Cost reaches ₹13,150
 * 
 * This will:
 * 1. Query download_billing_logs ordered by date (oldest first)
 * 2. Calculate cumulative sum
 * 3. Delete entries until sum reaches exactly or just over ₹13,150
 * 4. Delete corresponding image files
 * 5. Clean up generation_logs entries
 */

import pool from '../lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TARGET_AMOUNT = 13150;

async function deleteOldBillingData() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🔍 Fetching download billing logs...\n');
    
    // Get all download logs ordered by date with cumulative sum
    const [rows]: any = await connection.execute(`
      SELECT 
        dbl.id,
        dbl.user_id,
        dbl.generation_log_id,
        dbl.amount_inr,
        dbl.created_at,
        u.email,
        gl.generated_image_url,
        gl.original_image_url,
        gl.phone_model
      FROM download_billing_logs dbl
      JOIN users u ON dbl.user_id = u.id
      LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
      ORDER BY dbl.created_at ASC
    `);
    
    if (!rows || rows.length === 0) {
      console.log('❌ No billing data found');
      return;
    }
    
    // Calculate which entries to delete
    let cumulativeSum = 0;
    const entriesToDelete: any[] = [];
    const generationLogIds = new Set<number>();
    const imageUrls: string[] = [];
    
    for (const row of rows) {
      if (cumulativeSum >= TARGET_AMOUNT) break;
      
      cumulativeSum += parseFloat(row.amount_inr);
      entriesToDelete.push(row);
      
      if (row.generation_log_id) {
        generationLogIds.add(row.generation_log_id);
      }
      
      if (row.generated_image_url) {
        imageUrls.push(row.generated_image_url);
      }
      if (row.original_image_url) {
        imageUrls.push(row.original_image_url);
      }
      
      console.log(`✓ ID: ${row.id} | User: ${row.email} | Amount: ₹${row.amount_inr} | Cumulative: ₹${cumulativeSum.toFixed(2)}`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total entries to delete: ${entriesToDelete.length}`);
    console.log(`   Total amount to remove: ₹${cumulativeSum.toFixed(2)}`);
    console.log(`   Generation logs to clean: ${generationLogIds.size}`);
    console.log(`   Image files to delete: ${imageUrls.length}`);
    
    if (entriesToDelete.length === 0) {
      console.log('❌ No entries found to delete');
      return;
    }
    
    // Delete download billing logs
    const billingIds = entriesToDelete.map(e => e.id);
    console.log(`\n🗑️  Deleting ${billingIds.length} download billing logs...`);
    await connection.execute(
      `DELETE FROM download_billing_logs WHERE id IN (${billingIds.join(',')})` 
    );
    console.log('✓ Download billing logs deleted');
    
    // Delete generation logs if they have no more downloads
    if (generationLogIds.size > 0) {
      console.log(`\n🗑️  Checking generation logs for cleanup...`);
      const genLogIdArray = Array.from(generationLogIds);
      
      // Find generation logs with no remaining downloads
      const [orphanedLogs]: any = await connection.execute(`
        SELECT gl.id 
        FROM generation_logs gl
        WHERE gl.id IN (${genLogIdArray.join(',')})
        AND NOT EXISTS (
          SELECT 1 FROM download_billing_logs dbl 
          WHERE dbl.generation_log_id = gl.id
        )
      `);
      
      if (orphanedLogs.length > 0) {
        const orphanedIds = orphanedLogs.map((l: any) => l.id);
        console.log(`   Found ${orphanedIds.length} orphaned generation logs`);
        await connection.execute(
          `DELETE FROM generation_logs WHERE id IN (${orphanedIds.join(',')})`
        );
        console.log('✓ Orphaned generation logs deleted');
      } else {
        console.log('   No orphaned generation logs found');
      }
    }
    
    // Delete image files
    console.log(`\n🗑️  Deleting ${imageUrls.length} image files...`);
    let deletedFiles = 0;
    let notFoundFiles = 0;
    
    for (const url of imageUrls) {
      if (!url) continue;
      
      // Convert URL to file path
      const filePath = join(process.cwd(), 'public', url.replace(/^\//, ''));
      
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
          deletedFiles++;
          console.log(`   ✓ Deleted: ${url}`);
        } catch (err: any) {
          console.log(`   ✗ Failed to delete: ${url} - ${err.message}`);
        }
      } else {
        notFoundFiles++;
        console.log(`   ⚠ Not found: ${url}`);
      }
    }
    
    console.log(`\n   Files deleted: ${deletedFiles}`);
    console.log(`   Files not found: ${notFoundFiles}`);
    
    await connection.commit();
    
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log(`   Removed ₹${cumulativeSum.toFixed(2)} worth of billing data`);
    console.log(`   ${billingIds.length} download logs deleted`);
    console.log(`   ${deletedFiles} image files deleted`);
    
  } catch (error: any) {
    await connection.rollback();
    console.error('\n❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the cleanup
deleteOldBillingData()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
