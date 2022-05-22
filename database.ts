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
    await connection.select("*").from("settings");
  } catch (error) {
    await setup(connection);
  }
};

export async function getConnection(): Promise<Knex> {
  if (!connection) {
    connection = knex({
      client: "mysql",
      connection: connectionObject,
    });
    await checkForInstallation();
  }
  return connection;
}
