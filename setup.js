const { db } = require("./util.js");
const fs = require("fs");
const path = require("path");
const { rights, settings, typeMap } = require("blog-spec");
const { exit } = require("process");

let dbCon;
let errors = [];

const setupRights = async () => {
  dbCon = await db.getConnection();
  const query = "INSERT INTO roles_rights (role, action) VALUES(?, ?)";
  for (action of Object.keys(rights)) {
    for (role of rights[action].defaultRoles) {
      dbCon.query(query, [role, action]).catch((error) => {
        errors.push(error);
      });
    }
  }
};

const setupSettings = async () => {
  dbCon = await db.getConnection();
  const query =
    "INSERT INTO settings (`id`, `int`, `float`, `varchar`) VALUES(?, ?, ?, ?)";
  for (id of Object.keys(settings)) {
    const type = settings[id].dataType
      ? settings[id].dataType
      : typeMap[settings[id].type];
    const value = settings[id].default
      ? settings[id].default
      : type === "varchar"
      ? ""
      : 0;
    await dbCon
      .query(query, [
        id,
        type === "int" ? value : 0,
        type === "float" ? value : 0,
        type === "varchar" ? value : "",
      ])
      .catch((error) => {
        errors.push(error);
      });
  }
};

const setupTables = async () => {
  dbCon = await db.getConnection();
  const queries = fs
    .readFileSync(path.join(__dirname, "db.sql"), { encoding: "UTF-8" })
    .split(";\n");
  for (query of queries) {
    if (query.length && !query.match(/\/\*/)) {
      await dbCon.query(query).catch((error) => {
        errors.push(error);
      });
    }
  }
};

const setup = async () => {
  await setupTables();
  await setupRights();
  await setupSettings();
  return;
};

setup();
