import "dotenv/config";
import { Knex, knex }  from "knex";

let connection: Promise<Knex>;

const connectionObject = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

export async function getConnection(): Promise<Knex<any, any[]>> {
  return connection || knex({
    client: "mysql",
    connection: connectionObject
  })
}

export default {
  getConnection
}