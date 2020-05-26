require("dotenv").config();
const mariaDB = require("mariadb");

let connection = false;

module.exports = {
  getConnection: async () => {
    if (!connection) {
      connection = mariaDB.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      });
      connection.then((openConnection) => {
        openConnection.on("error", (error) => {
          console.log("Database connection error", error);
          connection = false;
        });
      });
    }
    return connection;
  },
};
