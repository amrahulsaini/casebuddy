// Quick database check script
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'case_main',
    });

    console.log('✅ Connected to database\n');

    // Check if new tables exist
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'phone_brands'"
    );
    
    if (tables.length > 0) {
      console.log('✅ phone_brands table exists');
      
      // Count brands
      const [brands] = await connection.execute('SELECT COUNT(*) as count FROM phone_brands');
      console.log(`   Found ${brands[0].count} phone brands\n`);
    } else {
      console.log('❌ phone_brands table NOT found - SQL migration not run!\n');
    }

    // Check if categories table has new columns
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM categories LIKE 'customization%'"
    );
    
    if (columns.length > 0) {
      console.log('✅ Categories table has customization columns:');
      columns.forEach(col => console.log(`   - ${col.Field}`));
    } else {
      console.log('❌ Categories table missing customization columns - SQL migration not run!\n');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Make sure to:');
    console.log('1. Update your .env file with correct database credentials');
    console.log('2. Run the SQL migration: database/add-phone-customization.sql');
  }
}

checkDatabase();
