const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'case_main',
  password: process.env.DB_PASSWORD || 'main',
  database: process.env.DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`  ↳ Redirecting to: ${redirectUrl}`);
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main fix function
async function fixProductImages() {
  let connection;
  
  try {
    console.log('🔧 Starting product images fix...\n');
    
    // Read JSON file to get original image URLs
    const jsonPath = path.join(__dirname, '..', 'app', 'atcasa_data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📦 Found ${jsonData.length} products in JSON\n`);
    
    // Create products directory if it doesn't exist
    const productsDir = path.join(__dirname, '..', 'public', 'products', 'designer-slim-case');
    await mkdir(productsDir, { recursive: true });
    console.log(`📁 Directory ready: ${productsDir}\n`);
    
    connection = await pool.getConnection();
    
    // Get all products with default images
    const [products] = await connection.execute(
      `SELECT p.id, p.name, p.slug, pi.id as image_id
       FROM products p
       JOIN product_images pi ON p.id = pi.product_id
       WHERE pi.image_url = '/products/default.jpg' AND pi.is_primary = TRUE`
    );
    
    console.log(`🔍 Found ${products.length} products with default images\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`[${successCount + errorCount + 1}/${products.length}] Fixing: ${product.name}`);
        
        // Find matching product in JSON
        const jsonProduct = jsonData.find(item => {
          const slug = item.handle || item.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return slug === product.slug;
        });
        
        if (!jsonProduct || !jsonProduct.image_src) {
          console.log(`  ⚠️  No image found in JSON, skipping...\n`);
          errorCount++;
          continue;
        }
        
        const imageSourceUrl = jsonProduct.image_src;
        const imageFileName = `${product.slug}-${Date.now()}.jpg`;
        const imagePath = path.join(productsDir, imageFileName);
        
        console.log(`  📥 Downloading from: ${imageSourceUrl}`);
        
        try {
          await downloadImage(imageSourceUrl, imagePath);
          const newImageUrl = `/products/designer-slim-case/${imageFileName}`;
          
          // Update database
          await connection.execute(
            'UPDATE product_images SET image_url = ? WHERE id = ?',
            [newImageUrl, product.image_id]
          );
          
          console.log(`  ✓ Updated to: ${newImageUrl}\n`);
          successCount++;
        } catch (imgError) {
          console.log(`  ✗ Download failed: ${imgError.message}\n`);
          errorCount++;
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.log(`  ✗ Error: ${error.message}\n`);
      }
    }
    
    console.log('═'.repeat(60));
    console.log(`✅ Image fix completed!`);
    console.log(`   Success: ${successCount} products`);
    console.log(`   Errors: ${errorCount} products`);
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// Run the fix
fixProductImages();
