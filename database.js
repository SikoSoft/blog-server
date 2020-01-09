require("dotenv").config();
const mariaDB = require("mariadb");

const pool = mariaDB.createPool({
  host: process.env.DB_HOST,
  post: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

module.exports = pool;
