const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node fix-category-images.js <categorySlug> <jsonFile>');
  console.error('Example: node fix-category-images.js black-bumper-case atcasa_data2.json');
  process.exit(1);
}

const CATEGORY_SLUG = args[0];
const JSON_FILE = args[1];

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
async function fixCategoryImages() {
  let connection;
  
  try {
    console.log(`🔧 Starting image fix for ${CATEGORY_SLUG}...\n`);
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'app', JSON_FILE);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📦 Found ${jsonData.length} products in JSON\n`);
    
    // Create products directory if it doesn't exist
    const productsDir = path.join(__dirname, '..', 'public', 'products', CATEGORY_SLUG);
    await mkdir(productsDir, { recursive: true });
    console.log(`📁 Directory ready: ${productsDir}\n`);
    
    connection = await pool.getConnection();
    
    // Get category ID
    const [categories] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ?',
      [CATEGORY_SLUG]
    );
    
    if (categories.length === 0) {
      console.error(`❌ Category ${CATEGORY_SLUG} not found in database`);
      process.exit(1);
    }
    
    const categoryId = categories[0].id;
    console.log(`✓ Using category ID: ${categoryId}\n`);
    
    // Get all products with default images in this category
    const [products] = await connection.execute(
      `SELECT p.id, p.name, p.slug, pi.id as image_id
       FROM products p
       JOIN product_categories pc ON p.id = pc.product_id
       JOIN product_images pi ON p.id = pi.product_id
       WHERE pc.category_id = ? AND pi.image_url = '/products/default.jpg' AND pi.is_primary = TRUE`,
      [categoryId]
    );
    
    console.log(`🔍 Found ${products.length} products with default images\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`[${successCount + errorCount + 1}/${products.length}] Fixing: ${product.name}`);
        
        // Find matching product in JSON
        const jsonProduct = jsonData.find(item => {
          const slug = item.handle || item.title.toLowerCase().replace(/[^a-z0-9\\s-]/g, '').replace(/\\s+/g, '-');
          return slug === product.slug;
        });
        
        if (!jsonProduct) {
          console.log(`  ⚠️  No matching product found in JSON, skipping...\n`);
          errorCount++;
          continue;
        }
        
        // Handle multiple field names for image URL
        const imageSourceUrl = jsonProduct.image_src || jsonProduct.image || jsonProduct.imageUrl || jsonProduct.image_url;
        
        if (!imageSourceUrl) {
          console.log(`  ⚠️  No image URL found in JSON, skipping...\n`);
          errorCount++;
          continue;
        }
        
        const imageFileName = `${product.slug}-${Date.now()}.jpg`;
        const imagePath = path.join(productsDir, imageFileName);
        
        console.log(`  📥 Downloading from: ${imageSourceUrl}`);
        
        try {
          await downloadImage(imageSourceUrl, imagePath);
          const newImageUrl = `/products/${CATEGORY_SLUG}/${imageFileName}`;
          
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
    console.log(`✅ Image fix completed for ${CATEGORY_SLUG}!`);
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
fixCategoryImages();
