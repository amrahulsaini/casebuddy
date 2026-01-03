const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'case_main',
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read and run the SQL migration
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'database', 'add-text-color-to-hero-banners.sql'),
      'utf8'
    );

    await connection.query(sqlFile);
    console.log('✅ Successfully added text_color column to hero_banners table\n');

    // Verify the column was added
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM hero_banners LIKE 'text_color'"
    );
    
    if (columns.length > 0) {
      console.log('✅ text_color column verified:');
      console.log(`   Field: ${columns[0].Field}`);
      console.log(`   Type: ${columns[0].Type}`);
      console.log(`   Default: ${columns[0].Default}\n`);
    }

    await connection.end();
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes("Duplicate column name")) {
      console.log('\n⚠️  Column already exists - migration was already run!');
    }
  }
}

runMigration();
