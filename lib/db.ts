import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'case_main',
  password: process.env.DB_PASSWORD || 'main',
  database: process.env.DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
