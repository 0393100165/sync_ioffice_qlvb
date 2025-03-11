try {
  require.resolve('dotenv');
  require('dotenv').config(); // Load environment variables from .env file
} catch (e) {
  console.error('dotenv module is not installed. Please run "npm install dotenv" to install it.');
  process.exit(1);
}

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: true, // Use encryption
    enableArithAbort: true, // Required for Azure SQL
    trustServerCertificate: true // Trust self-signed certificates
  }
};

let pool;

async function connectToDb() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('Database connection established');
    } catch (err) {
      console.error('Database connection failed', err);
      throw err;
    }
  }
  return pool;
}

// Establish connection immediately
connectToDb();

module.exports = {
  query: async (query) => {
    const pool = await connectToDb();
    return pool.request().query(query);
  }
};
