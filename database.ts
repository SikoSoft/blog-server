import "dotenv/config";
import { Knex, knex } from "knex";

let connection: Knex<any>;

const connectionObject = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

export async function getConnection(): Promise<Knex> {
  if (!connection) {
    connection = knex({
      client: "mysql",
      connection: connectionObject,
    });
  }
  return connection;
}
