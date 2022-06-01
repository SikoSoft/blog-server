import "dotenv/config";
import { Knex, knex } from "knex";
import setup from "./setup";

let connection: Knex<any>;

const connectionObject = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const checkInstallation = async () => {
  try {
    setup(connection);
    console.log("Making sure tables are setup correctly...");
  } catch (error) {
    console.log("Something went wrong preparing tables");
  }
};

export async function getConnection(): Promise<Knex> {
  if (!connection) {
    console.log("No database connection yet; creating one now...");
    connection = knex({
      client: "mysql",
      connection: connectionObject,
    });
    await checkInstallation();
  }
  return connection;
}
