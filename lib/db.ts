import mysql from 'mysql2/promise';

// Main casetool database (for AI image generation)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'case_tool',
  password: process.env.DB_PASSWORD || 'tool',
  database: process.env.DB_NAME || 'case_tool',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Products database (for shop and admin)
export const productsPool = mysql.createPool({
  host: process.env.MAIN_DB_HOST || 'localhost',
  user: process.env.MAIN_DB_USER || 'case_main',
  password: process.env.MAIN_DB_PASSWORD || 'main',
  database: process.env.MAIN_DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
