/**
 * Script to import phone brands and models from Excel file (SERVER VERSION)
 * 
 * SETUP ON SERVER:
 * 1. Upload all-brands-and-models.xlsx to /home/casebuddy.co.in/public_html/casebuddy/
 * 2. Upload this script to /home/casebuddy.co.in/public_html/casebuddy/scripts/
 * 3. Install required package: npm install xlsx
 * 4. Update database credentials below
 * 
 * RUN ON SERVER:
 * cd /home/casebuddy.co.in/public_html/casebuddy
 * node scripts/import-phones-server.js
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

// Database configuration - UPDATE THESE FOR YOUR SERVER
const DB_CONFIG = {
  host: 'localhost',
  user: 'case_main',
  password: 'main',
  database: 'case_main',
};

// Function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Replace multiple hyphens with single
}

async function importPhonesFromExcel() {
  let connection;

  try {
    // Read the Excel file from server path
    console.log('📖 Reading Excel file from server...');
    console.log('Looking for file at: /home/casebuddy.co.in/public_html/casebuddy/all-brands-and-models.xlsx');
    
    const workbook = XLSX.readFile('/home/casebuddy.co.in/public_html/casebuddy/all-brands-and-models.xlsx');
    const sheetName = workbook.SheetNames[0];
    console.log(`📄 Reading sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`✅ Found ${data.length} rows in Excel`);
    console.log('First 10 rows:');
    data.slice(0, 10).forEach((row, idx) => {
      console.log(`  Row ${idx + 1}: ${row[0]}`);
    });

    // Connect to database
    console.log('\n🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connected');

    let currentBrand = null;
    let currentBrandId = null;
    let totalBrands = 0;
    let totalModels = 0;
    let skippedRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cellValue = row[0]; // First column

      if (!cellValue || cellValue.trim() === '') {
        skippedRows++;
        continue; // Skip empty rows
      }

      const trimmedValue = cellValue.trim();

      // Brand names are in bold in Excel
      // If value doesn't start with current brand name, it's a new brand
      // Example: "Apple" is brand, "Apple iPhone 11" is model
      
      const startsWithBrand = currentBrand && trimmedValue.toLowerCase().startsWith(currentBrand.toLowerCase());

      if (!startsWithBrand) {
        // This is a new brand header
        currentBrand = trimmedValue;
        const brandSlug = createSlug(currentBrand);

        console.log(`\n📱 Processing brand: ${currentBrand}`);

        // Insert or get brand
        const [existingBrand] = await connection.execute(
          'SELECT id FROM phone_brands WHERE slug = ?',
          [brandSlug]
        );

        if (existingBrand.length > 0) {
          currentBrandId = existingBrand[0].id;
          console.log(`   ℹ️  Brand already exists (ID: ${currentBrandId})`);
        } else {
          const [result] = await connection.execute(
            'INSERT INTO phone_brands (name, slug, is_active, sort_order) VALUES (?, ?, 1, ?)',
            [currentBrand, brandSlug, totalBrands]
          );
          currentBrandId = result.insertId;
          totalBrands++;
          console.log(`   ✅ Brand created (ID: ${currentBrandId})`);
        }
      } else {
        // This is a phone model (starts with brand name)
        if (!currentBrandId) {
          console.log(`   ⚠️  Skipping model "${trimmedValue}" - no brand context`);
          continue;
        }

        const modelName = trimmedValue;
        const modelSlug = createSlug(modelName);

        // Check if model already exists
        const [existingModel] = await connection.execute(
          'SELECT id FROM phone_models WHERE brand_id = ? AND slug = ?',
          [currentBrandId, modelSlug]
        );

        if (existingModel.length > 0) {
          console.log(`   ⏭️  Model already exists: ${modelName}`);
        } else {
          await connection.execute(
            'INSERT INTO phone_models (brand_id, model_name, slug, is_active, sort_order) VALUES (?, ?, ?, 1, ?)',
            [currentBrandId, modelName, modelSlug, totalModels]
          );
          totalModels++;
          console.log(`   ✅ Added model: ${modelName}`);
        }
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total rows processed: ${data.length}`);
    console.log(`   - Empty rows skipped: ${skippedRows}`);
    console.log(`   - Brands processed/created: ${totalBrands}`);
    console.log(`   - Models added: ${totalModels}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the import
importPhonesFromExcel();
