import "dotenv/config";
import { Knex, knex } from "knex";
import { setup, getModelsHash } from "./setup";

let connection: Knex<any>;

const connectionObject = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const checkInstallation = async (): Promise<void> => {
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
    const modelsHash = getModelsHash();
    if (
      !process.env.SPEC_MODELS_HASH ||
      process.env.SPEC_MODELS_HASH !== modelsHash
    ) {
      console.log(
        "Database not yet setup, or models have drifted from current setup."
      );
      await checkInstallation();
    } else {
      console.log(
        "Model state matches current setup; skipping database integrity check."
      );
    }
  }
  return connection;
}
