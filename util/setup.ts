import { DatabaseTable } from "blog-spec";
const fs = require("fs");
const { rights, roles, settings, typeMap, models } = require("blog-spec");

const syncTables = async (connection) => {
  for (const model of models) {
    const exists = await connection.schema.hasTable(model.id);
    if (exists) {
      console.log(`Table '${model.id}' exists; checking integrity`);
      await syncTable(connection, model);
    } else {
      console.log(`Table '${model.id}' does not exists`);
      await createTable(connection, model);
    }
  }
};

const syncTable = async (connection, model: DatabaseTable) => {
  const structure = await connection(model.id).columnInfo();
  const missingColumns = [];
  const driftColumns = [];
  for (const column of model.attributes) {
    const specType = column.dataType || typeMap[column.type];
    if (typeof structure[column.id] === "undefined") {
      console.log(`Column ${model.id}.${column.id} does not exist`);
      missingColumns.push(column);
    } else if (structure[column.id].type !== specType) {
      console.log(
        `Column ${model.id}.${column.id} is not the same as the spec (${
          structure[column.id].type
        } / ${specType})`
      );
      driftColumns.push(column);
    }
  }
  if (missingColumns.length) {
    await createColumns(connection, model, missingColumns);
  }
  if (driftColumns.length) {
    await createColumns(connection, model, driftColumns, "alterTable");
  }
};

const createColumns = async (
  connection,
  model: DatabaseTable,
  columns: any,
  tableMethod: string = "table"
) => {
  await connection.schema[tableMethod](model.id, (table) => {
    for (const column of columns) {
      let columnBuilder;
      switch (column.dataType) {
        case "int":
          if (column.autoIncrement) {
            columnBuilder = table.increments(column.id);
          } else {
            columnBuilder = table.integer(column.id, column.maxLength || 10);
          }
          break;
        case "varchar":
          columnBuilder = table.string(column.id, column.maxLength || 255);
          break;
        case "longtext":
          columnBuilder = table.text(column.id, "longtext");
          break;
      }
      columnBuilder.defaultTo(
        column.default ? column.default : column.dataType === "int" ? 0 : ""
      );
      if (column.primary) {
        columnBuilder.primary();
      }
      if (tableMethod === "alterTable") {
        columnBuilder.alter();
      }
      console.log(
        `${tableMethod === "alterTable" ? "Altered" : "Created"} ${model.id}.${
          column.id
        } column`
      );
    }
  });
};

const createTable = async (connection, model) => {
  console.log(`Creating table ${model.id}...`);
  await createColumns(connection, model, model.attributes, "createTable");
};

const setupRights = async (connection) => {
  for (const right of rights) {
    for (const role of right.defaultRoles) {
      await connection("roles_rights").insert({ role, action: right.id });
    }
  }
};

const setupRoles = async (connection) => {
  for (const role of roles) {
    await connection("roles").insert({ id: role.id, name: role.name });
  }
};

const setupSettings = async (connection) => {
  for (const setting of settings) {
    const type = setting.dataType ? setting.dataType : typeMap[setting.type];
    const value = setting.default
      ? setting.default
      : type === "varchar"
      ? ""
      : 0;
    await connection("settings").insert({
      id: setting.id,
      int: type === "int" ? value : 0,
      float: type === "float" ? value : 0,
      varchar: type === "varchar" ? value : "",
    });
  }
};

const setupTables = async (connection) => {
  const queries = fs
    .readFileSync("./db.sql", { encoding: "UTF-8" })
    .split(";\n");
  for (const query of queries) {
    if (query.length && !query.match(/\/\*/)) {
      await connection.raw(query);
    }
  }
};

const setupHeader = async (connection) => {
  await connection("banners").insert({
    heading: "Blog",
    caption: "Howdy world",
    image: "https://ssblogdata.blob.core.windows.net/misc/universe.jpg",
  });
  await connection("settings").insert({ id: "header_banner", int: 1 });
};

export default async function (connection) {
  await syncTables(connection);
  //await setupTables(connection);
  //await setupRoles(connection);
  //await setupRights(connection);
  //await setupSettings(connection);
  //await setupHeader(connection);
}
