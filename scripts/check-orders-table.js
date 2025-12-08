// Check if orders table exists and create if needed
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkOrdersTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MAIN_DB_HOST || 'localhost',
      user: process.env.MAIN_DB_USER || 'case_main',
      password: process.env.MAIN_DB_PASSWORD || 'main',
      database: process.env.MAIN_DB_NAME || 'case_main',
    });

    console.log('✅ Connected to database\n');

    // Check if orders table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'orders'"
    );
    
    if (tables.length > 0) {
      console.log('✅ orders table exists');
      
      // Count orders
      const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
      console.log(`   Found ${orders[0].count} orders\n`);
      
      // Check column names
      const [columns] = await connection.execute('SHOW COLUMNS FROM orders');
      console.log('📋 Orders table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
    } else {
      console.log('❌ orders table NOT found\n');
      console.log('Creating orders table...\n');
      
      // Read and execute the SQL file
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, '../database/add-orders-table.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await connection.query(sql);
      console.log('✅ orders table created successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n📝 The orders table does not exist. Run: database/add-orders-table.sql');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkOrdersTable();
