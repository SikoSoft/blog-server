const fs = require("fs");
const path = require("path");
const { rights, roles, settings, typeMap } = require("blog-spec");

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
  await setupTables(connection);
  await setupRoles(connection);
  await setupRights(connection);
  await setupSettings(connection);
  await setupHeader(connection);
}
