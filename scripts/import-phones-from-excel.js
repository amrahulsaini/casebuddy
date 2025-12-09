/**
 * Script to import phone brands and models from Excel file
 * 
 * SETUP:
 * 1. Install required package: npm install xlsx
 * 2. Save your Excel file as 'phones.xlsx' in the scripts folder
 * 3. Make sure Excel has columns: Brand name in first column, then phone models below it
 * 
 * RUN:
 * node scripts/import-phones-from-excel.js
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

// Database configuration
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
    // Read the Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile('./all-brands-and-models.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`✅ Found ${data.length} rows in Excel`);

    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connected');

    let currentBrand = null;
    let currentBrandId = null;
    let totalBrands = 0;
    let totalModels = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cellValue = row[0]; // First column

      if (!cellValue || cellValue.trim() === '') {
        continue; // Skip empty rows
      }

      const trimmedValue = cellValue.trim();

      // Brand names are in bold (we detect by pattern: if it doesn't start with the current brand name, it's a new brand)
      // For example: "Apple" is brand, "Apple iPhone 11" is model
      // "OnePlus" is brand, "OnePlus 10 Pro 5G" is model
      
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
    console.log(`   - Brands processed/created: ${totalBrands}`);
    console.log(`   - Models added: ${totalModels}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
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
