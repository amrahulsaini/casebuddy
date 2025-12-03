import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'case_tool',
  password: process.env.DB_PASSWORD || 'tool',
  database: process.env.DB_NAME || 'case_tool',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
