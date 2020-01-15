require("dotenv").config();
const mariaDB = require("mariadb");

module.exports = {
  getConnection: async () => {
    return mariaDB.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
  }
};
