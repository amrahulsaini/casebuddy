/**
 * ===================================================================
 * DELETE ORPHANED IMAGE FILES ONLY (NO DATABASE CHANGES)
 * ===================================================================
 * 
 * USAGE ON SERVER:
 * 1. Upload this file to your server
 * 2. cd /home/your-user/casetool
 * 3. node delete-orphaned-images.js
 * 
 * This script will ONLY delete image files that don't have 
 * corresponding database records. NO DATABASE CHANGES.
 * ===================================================================
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration - UPDATE THESE WITH YOUR SERVER CREDENTIALS
const dbConfig = {
  host: 'localhost',
  user: 'case_tool',
  password: 'tool',
  database: 'case_tool',
};

async function deleteOrphanedImages() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...\n');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Finding orphaned images (generation_logs without download_billing_logs)...\n');
    
    // Get all generation_logs that have NO corresponding download_billing_logs
    const [orphanedLogs] = await connection.execute(`
      SELECT 
        gl.id,
        gl.generated_image_url,
        gl.original_image_url,
        gl.phone_model,
        gl.created_at
      FROM generation_logs gl
      WHERE NOT EXISTS (
        SELECT 1 FROM download_billing_logs dbl 
        WHERE dbl.generation_log_id = gl.id
      )
      AND (gl.generated_image_url IS NOT NULL OR gl.original_image_url IS NOT NULL)
      ORDER BY gl.created_at ASC
    `);
    
    if (!orphanedLogs || orphanedLogs.length === 0) {
      console.log('✓ No orphaned images found. All images have corresponding billing records.');
      return;
    }
    
    console.log(`📊 Found ${orphanedLogs.length} orphaned generation logs with images\n`);
    
    // Collect all image URLs
    const imageUrls = [];
    for (const log of orphanedLogs) {
      if (log.generated_image_url) {
        imageUrls.push(log.generated_image_url);
      }
      if (log.original_image_url) {
        imageUrls.push(log.original_image_url);
      }
    }
    
    console.log(`📊 Total image files to check: ${imageUrls.length}\n`);
    
    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete image files!');
    console.log('⚠️  No database records will be modified.');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete image files
    console.log('🗑️  Deleting image files...\n');
    let deletedFiles = 0;
    let notFoundFiles = 0;
    let errorFiles = 0;
    
    for (const url of imageUrls) {
      try {
        // Extract file path from URL
        // URL format: /uploads/casetool/generated/image.png or /uploads/casetool/original/image.jpg
        const urlPath = new URL(url, 'http://localhost').pathname;
        const filePath = path.join(__dirname, 'public', urlPath);
        
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`   ✓ Deleted: ${urlPath}`);
          deletedFiles++;
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log(`   ⚠ Not found: ${urlPath}`);
            notFoundFiles++;
          } else {
            throw err;
          }
        }
      } catch (error) {
        console.error(`   ✗ Error deleting ${url}: ${error.message}`);
        errorFiles++;
      }
    }
    
    console.log(`\n✅ Image deletion complete!`);
    console.log(`   📊 Summary:`);
    console.log(`      Deleted: ${deletedFiles}`);
    console.log(`      Not found: ${notFoundFiles}`);
    console.log(`      Errors: ${errorFiles}`);
    console.log(`\n💡 NOTE: Database records were NOT modified.`);
    console.log(`   If you want to clean up generation_logs too, run:`);
    console.log(`   DELETE FROM generation_logs WHERE NOT EXISTS (`);
    console.log(`     SELECT 1 FROM download_billing_logs WHERE generation_log_id = generation_logs.id`);
    console.log(`   );`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
deleteOrphanedImages()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
