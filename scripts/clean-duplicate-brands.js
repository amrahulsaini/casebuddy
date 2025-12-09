/**
 * Script to clean up duplicate brands (phone models saved as brands)
 * 
 * RUN:
 * node scripts/clean-duplicate-brands.js
 */

const mysql = require('mysql2/promise');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  user: 'case_main',
  password: 'main',
  database: 'case_main',
};

// Known brand names
const VALID_BRANDS = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Poco', 'Vivo', 'Oppo', 
  'Realme', 'Nokia', 'Motorola', 'Google', 'Asus', 'Honor', 'Huawei', 
  'Nothing', 'iQOO', 'Infinix', 'Tecno', 'Lava', 'Micromax', 'Sony', 'Mi'
];

async function cleanDuplicateBrands() {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connected\n');

    // Get all brands
    const [brands] = await connection.execute('SELECT id, name, slug FROM phone_brands');
    
    console.log(`Found ${brands.length} brands in database`);
    console.log('Checking for invalid brands (models saved as brands)...\n');

    let deleted = 0;
    let kept = 0;

    for (const brand of brands) {
      const isValid = VALID_BRANDS.some(validBrand => 
        brand.name.toLowerCase() === validBrand.toLowerCase()
      );

      if (!isValid) {
        // Check if this brand has any models
        const [models] = await connection.execute(
          'SELECT COUNT(*) as count FROM phone_models WHERE brand_id = ?',
          [brand.id]
        );

        if (models[0].count === 0) {
          // Delete brand with no models
          await connection.execute('DELETE FROM phone_brands WHERE id = ?', [brand.id]);
          console.log(`🗑️  Deleted: ${brand.name} (ID: ${brand.id}) - No models`);
          deleted++;
        } else {
          console.log(`⚠️  Invalid brand with models: ${brand.name} (ID: ${brand.id}) - ${models[0].count} models`);
          console.log(`   You may want to manually reassign these models to correct brand`);
        }
      } else {
        kept++;
      }
    }

    console.log(`\n✅ Cleanup completed!`);
    console.log(`   - Valid brands kept: ${kept}`);
    console.log(`   - Invalid brands deleted: ${deleted}`);
    console.log(`\nValid brands remaining: ${VALID_BRANDS.join(', ')}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the cleanup
cleanDuplicateBrands();
