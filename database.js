require("dotenv").config();
const knex = require("knex");
const mariaDB = require("mariadb");

let connection = false;
let connectionNew = false;

const connectionObject = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

module.exports = {
  getConnection: async () => {
    if (!connection) {
      connection = mariaDB.createConnection(connectionObject);
      connection.then((openConnection) => {
        openConnection.on("error", (error) => {
          console.log("Database connection error", error);
          connection = false;
        });
      });
    }
    return connection;
  },

  getConnectionNew: async () => {
    try {
      connectionNew = knex({
        client: "mysql",
        connection: connectionObject,
      });
    } catch (error) {
      console.error(error);
    }
    return connectionNew;
  },
};
