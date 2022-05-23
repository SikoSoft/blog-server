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

const checkForInstallation = async () => {
  try {
    console.log("Checking for settings table...");
    await connection.select("*").from("settings");
  } catch (error) {
    console.log(
      "Something went wrong looking up settings table; performing setup now..."
    );
    await setup(connection);
  }
};

export async function getConnection(): Promise<Knex> {
  if (!connection) {
    console.log("No database connection yet; creating one now...");
    connection = knex({
      client: "mysql",
      connection: connectionObject,
    });
    await checkForInstallation();
  }
  return connection;
}
