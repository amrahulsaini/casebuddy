import mysql from 'mysql2/promise';

const caseMainPool = mysql.createPool({
  host: process.env.MAIN_DB_HOST || 'localhost',
  user: process.env.MAIN_DB_USER || 'case_main',
  password: process.env.MAIN_DB_PASSWORD || 'main',
  database: process.env.MAIN_DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default caseMainPool;
