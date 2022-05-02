const { db } = require("./util.js");
const fs = require("fs");
const path = require("path");
const { rights, roles, settings, typeMap } = require("blog-spec");

let dbCon;
let errors = [];

const setupRights = async () => {
  dbCon = await db.getConnection();
  const query = "INSERT INTO roles_rights (role, action) VALUES(?, ?)";
  for (right of rights) {
    for (role of right.defaultRoles) {
      dbCon.query(query, [role, right.id]).catch((error) => {
        errors.push(error);
      });
    }
  }
};

const setupRoles = async () => {
  dbCon = await db.getConnection();
  const query = "INSERT INTO roles (id, name) VALUES(?, ?)";
  for (role of roles) {
    dbCon.query(query, [role.id, role.name]).catch((error) => {
      errors.push(error);
    });
  }
};

const setupSettings = async () => {
  dbCon = await db.getConnection();
  const query =
    "INSERT INTO settings (`id`, `int`, `float`, `varchar`) VALUES(?, ?, ?, ?)";
  for (setting of settings) {
    const type = setting.dataType ? setting.dataType : typeMap[setting.type];
    const value = setting.default
      ? setting.default
      : type === "varchar"
      ? ""
      : 0;
    await dbCon
      .query(query, [
        setting.id,
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
  await setupRoles();
  await setupRights();
  await setupSettings();
};

setup();
