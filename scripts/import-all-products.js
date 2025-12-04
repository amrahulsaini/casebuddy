const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node import-all-products.js <categorySlug> <categoryName> <jsonFile>');
  console.error('Example: node import-all-products.js black-bumper-case "Black Bumper Case" atcasa_data2.json');
  process.exit(1);
}

const CATEGORY_SLUG = args[0];
const CATEGORY_NAME = args[1];
const JSON_FILE = args[2];

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
        console.log(`    ↳ Redirecting to: ${redirectUrl}`);
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

// Create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Extract price from title or use default
function extractPrice(title, tags) {
  const priceMatch = title.match(/₹\s*(\d+)|Rs\s*(\d+)/i);
  if (priceMatch) {
    return parseFloat(priceMatch[1] || priceMatch[2]);
  }
  return 299.00;
}

// Main import function
async function importProducts() {
  let connection;
  
  try {
    console.log(`🚀 Starting product import for ${CATEGORY_NAME}...\n`);
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'app', JSON_FILE);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📦 Found ${jsonData.length} products to import\n`);
    
    // Create products directory if it doesn't exist
    const productsDir = path.join(__dirname, '..', 'public', 'products', CATEGORY_SLUG);
    await mkdir(productsDir, { recursive: true });
    console.log(`📁 Created directory: ${productsDir}\n`);
    
    connection = await pool.getConnection();
    
    // Check if category exists, if not create it
    const [categories] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ?',
      [CATEGORY_SLUG]
    );
    
    let categoryId;
    if (categories.length === 0) {
      console.log(`📝 Creating "${CATEGORY_NAME}" category...`);
      const [result] = await connection.execute(
        `INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active) 
         VALUES (?, ?, ?, NULL, 1, TRUE)`,
        [CATEGORY_NAME, CATEGORY_SLUG, `Premium ${CATEGORY_NAME.toLowerCase()} with unique designs`]
      );
      categoryId = result.insertId;
      console.log(`✓ Category created with ID: ${categoryId}\n`);
    } else {
      categoryId = categories[0].id;
      console.log(`✓ Using existing category ID: ${categoryId}\n`);
    }
    
    // Import products
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
      
      try {
        console.log(`[${i + 1}/${jsonData.length}] Processing: ${item.title}`);
        
        // Create slug from title (handle)
        const slug = item.handle || createSlug(item.title);
        
        // Check if product already exists
        const [existing] = await connection.execute(
          'SELECT id FROM products WHERE slug = ?',
          [slug]
        );
        
        if (existing.length > 0) {
          console.log(`  ⚠️  Product already exists, skipping...\n`);
          continue;
        }
        
        // Download and save image
        let imageUrl = '/products/default.jpg';
        if (item.image_src) {
          const imageFileName = `${slug}-${Date.now()}.jpg`;
          const imagePath = path.join(productsDir, imageFileName);
          const imageSourceUrl = item.image_src;
          
          console.log(`  📥 Downloading from: ${imageSourceUrl}`);
          
          try {
            await downloadImage(imageSourceUrl, imagePath);
            imageUrl = `/products/${CATEGORY_SLUG}/${imageFileName}`;
            console.log(`  ✓ Saved as: ${imageUrl}`);
          } catch (imgError) {
            console.log(`  ✗ Failed to download image: ${imgError.message}`);
            console.log(`  📝 Using default image instead`);
          }
        } else {
          console.log(`  📝 No image URL found, using default`);
        }
        
        // Extract price
        const price = extractPrice(item.title, item.tags);
        
        // Insert product
        const [productResult] = await connection.execute(
          `INSERT INTO products (
            name, slug, description, short_description, price, 
            compare_price, sku, stock_quantity, is_featured, is_active
          ) VALUES (?, ?, ?, ?, ?, NULL, ?, 999, FALSE, TRUE)`,
          [
            item.title,
            slug,
            item.body_html || '',
            item.title.substring(0, 200),
            price,
            slug.toUpperCase()
          ]
        );
        
        const productId = productResult.insertId;
        
        // Link product to category
        await connection.execute(
          'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
          [productId, categoryId]
        );
        
        // Insert primary image
        await connection.execute(
          `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
           VALUES (?, ?, ?, 0, TRUE)`,
          [productId, imageUrl, item.title]
        );
        
        successCount++;
        console.log(`  ✓ Product imported successfully (ID: ${productId})\n`);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.log(`  ✗ Error: ${error.message}\n`);
      }
    }
    
    console.log('═'.repeat(60));
    console.log(`✅ Import completed for ${CATEGORY_NAME}!`);
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

// Run the import
importProducts();
