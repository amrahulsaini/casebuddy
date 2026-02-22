/**
 * ===================================================================
 * NODE.JS SCRIPT TO DELETE BILLING DATA AND IMAGES (RUN ON SERVER)
 * ===================================================================
 * 
 * USAGE:
 * 1. Upload this file to your server: /home/your-user/casetool/
 * 2. SSH into your server
 * 3. cd /home/your-user/casetool
 * 4. node cleanup-billing-on-server.js
 * 
 * This script will:
 * - Delete billing entries totaling ₹13,150 (oldest first)
 * - Delete corresponding image files
 * - Clean up orphaned generation_logs
 * ===================================================================
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const TARGET_AMOUNT = 13150;

// Database configuration - UPDATE THESE WITH YOUR SERVER CREDENTIALS
const dbConfig = {
  host: 'localhost',
  user: 'case_tool',
  password: 'tool',
  database: 'case_tool',
};

async function deleteOldBillingData() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...\n');
    connection = await mysql.createConnection(dbConfig);
    
    await connection.beginTransaction();
    
    console.log('🔍 Fetching download billing logs...\n');
    
    // Get all download logs ordered by date
    const [rows] = await connection.execute(`
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
    const entriesToDelete = [];
    const generationLogIds = new Set();
    const imageUrls = [];
    
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
    
    // Ask for confirmation (comment out if running automated)
    console.log('\n⚠️  WARNING: This will permanently delete data!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete download billing logs
    const billingIds = entriesToDelete.map(e => e.id);
    console.log(`\n🗑️  Deleting ${billingIds.length} download billing logs...`);
    await connection.execute(
      `DELETE FROM download_billing_logs WHERE id IN (?)`,
      [billingIds]
    );
    console.log('✓ Download billing logs deleted');
    
    // Delete generation logs if they have no more downloads
    if (generationLogIds.size > 0) {
      console.log(`\n🗑️  Checking generation logs for cleanup...`);
      const genLogIdArray = Array.from(generationLogIds);
      
      // Find generation logs with no remaining downloads
      const [orphanedLogs] = await connection.execute(`
        SELECT gl.id 
        FROM generation_logs gl
        WHERE gl.id IN (?)
        AND NOT EXISTS (
          SELECT 1 FROM download_billing_logs dbl 
          WHERE dbl.generation_log_id = gl.id
        )
      `, [genLogIdArray]);
      
      if (orphanedLogs.length > 0) {
        const orphanedIds = orphanedLogs.map(l => l.id);
        console.log(`   Found ${orphanedIds.length} orphaned generation logs`);
        await connection.execute(
          `DELETE FROM generation_logs WHERE id IN (?)`,
          [orphanedIds]
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
    const uniqueUrls = [...new Set(imageUrls)]; // Remove duplicates
    
    for (const url of uniqueUrls) {
      if (!url) continue;
      
      // Convert URL to file path
      // Assuming script runs from project root
      const filePath = path.join(__dirname, 'public', url.replace(/^\//, ''));
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        deletedFiles++;
        console.log(`   ✓ Deleted: ${url}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          notFoundFiles++;
          console.log(`   ⚠ Not found: ${url}`);
        } else {
          console.log(`   ✗ Failed to delete: ${url} - ${err.message}`);
        }
      }
    }
    
    console.log(`\n   Files deleted: ${deletedFiles}`);
    console.log(`   Files not found: ${notFoundFiles}`);
    
    await connection.commit();
    
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log(`   Removed ₹${cumulativeSum.toFixed(2)} worth of billing data`);
    console.log(`   ${billingIds.length} download logs deleted`);
    console.log(`   ${deletedFiles} image files deleted`);
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
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
