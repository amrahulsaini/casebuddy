import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MAIN_DB_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MAIN_DB_USER || process.env.DB_USER || 'case_main',
  password: process.env.MAIN_DB_PASSWORD || process.env.DB_PASSWORD || 'main',
  database: process.env.MAIN_DB_NAME || process.env.DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
