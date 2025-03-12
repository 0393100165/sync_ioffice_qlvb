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

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
