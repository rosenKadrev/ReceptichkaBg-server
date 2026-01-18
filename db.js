const { Pool } = require('pg');
require('dotenv').config();

let pool;

const commonPoolSettings = {
  max: 20, // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000 // How long to wait for a connection
};

const poolConfig = process.env.DATABASE_URL
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      ...commonPoolSettings
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ...commonPoolSettings
    };

const connect = (callback) => {
  pool = new Pool(poolConfig);
  
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('Connected to PostgreSQL!');
      callback();
    })
    .catch(err => {
      console.error('Database connection error', err.stack);
      throw err;
    });
  
  pool.on('error', (err) => {
    console.error('Unexpected database error', err);
  });
};

const getDb = () => {
  if (pool) {
    return pool;
  }
  throw 'No database connection found!';
};

exports.connect = connect;
exports.getDb = getDb;