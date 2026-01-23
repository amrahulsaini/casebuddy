const mysql = require('mysql2/promise');

async function grantAdminAccess() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'case_tool',
  });

  try {
    console.log('Checking users table...\n');

    // Check if role column exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'role'"
    );

    if (columns.length === 0) {
      console.log('Adding role column to users table...');
      await connection.execute(
        "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER email, ADD INDEX idx_role (role)"
      );
      console.log('✓ Role column added successfully\n');
    } else {
      console.log('✓ Role column already exists\n');
    }

    // Get all users
    const [users] = await connection.execute(
      'SELECT id, email, role, created_at FROM users ORDER BY id'
    );

    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('Please sign up at /casetool/login first, then run this script again.');
      process.exit(0);
    }

    console.log('Current users:');
    console.log('─────────────────────────────────────────────────────');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Role: ${user.role || 'user'}`);
    });
    console.log('─────────────────────────────────────────────────────\n');

    // Get user choice from command line argument
    const userId = process.argv[2];
    const userEmail = process.argv[3];

    if (userId) {
      // Grant admin by user ID
      const [result] = await connection.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', userId]
      );

      if (result.affectedRows > 0) {
        console.log(`✓ User ID ${userId} granted admin access!`);
      } else {
        console.log(`✗ User ID ${userId} not found`);
      }
    } else if (userEmail) {
      // Grant admin by email
      const [result] = await connection.execute(
        'UPDATE users SET role = ? WHERE email = ?',
        ['admin', userEmail]
      );

      if (result.affectedRows > 0) {
        console.log(`✓ User with email ${userEmail} granted admin access!`);
      } else {
        console.log(`✗ User with email ${userEmail} not found`);
      }
    } else {
      // Make the first user admin (typical for initial setup)
      const firstUser = users[0];
      await connection.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', firstUser.id]
      );
      console.log(`✓ Granted admin access to: ${firstUser.email} (ID: ${firstUser.id})`);
    }

    console.log('\nAdmin access granted successfully!');
    console.log('Please refresh your browser and try accessing /casetool/net-billing again.\n');

    console.log('Usage examples:');
    console.log('  node scripts/grant-admin-access.js          # Makes first user admin');
    console.log('  node scripts/grant-admin-access.js 1        # Makes user ID 1 admin');
    console.log('  node scripts/grant-admin-access.js 2        # Makes user ID 2 admin');
    console.log('  node scripts/grant-admin-access.js "" user@example.com  # Makes user with email admin');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

grantAdminAccess();
