const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'case_main',
    password: process.env.DB_PASSWORD || 'main',
    database: process.env.DB_NAME || 'case_main',
  });

  try {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || 'admin@casebuddy.com';
    const fullName = process.argv[5] || 'Admin User';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const [existing] = await connection.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log(`✗ User '${username}' already exists`);
      process.exit(1);
    }

    // Create user
    await connection.execute(
      `INSERT INTO admin_users (username, password, email, full_name, role, is_active)
       VALUES (?, ?, ?, ?, 'admin', TRUE)`,
      [username, hashedPassword, email, fullName]
    );

    console.log('✓ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  Email: ${email}`);
    console.log('');
    console.log('You can now login at: /admin/login');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createAdminUser();
