import spec = require("blog-spec");
import { BlogRole } from "../interfaces/BlogRole";
import { state } from "./state";
import { getConnection } from "./database";

export async function getSettings() {
  if (state.settings) {
    return Promise.resolve(state.settings);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const settingsRows = await connection.select("*").from("settings");
      const settings = {};
      for (const setting of spec.settings) {
        const matchedRow = settingsRows.filter(
          (settingRow) => settingRow.id === setting.id
        );
        settings[setting.id] = matchedRow.length
          ? matchedRow[0][
              setting.dataType ? setting.dataType : spec.typeMap[setting.type]
            ]
          : setting.default;
      }
      state.settings = settings;
      resolve(settings);
    } catch (error) {
      reject(error);
    }
  });
}

export async function getTagRoles() {
  if (state.tagRoles) {
    return Promise.resolve(state.tagRoles);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const tagRolesRows = await connection.select("*").from("tags_rights");
      state.tagRoles = {};
      tagRolesRows.forEach((row) => {
        if (!state.tagRoles[row.tag]) {
          state.tagRoles[row.tag] = [];
        }
        state.tagRoles[row.tag].push(row.role);
      });
      resolve(state.tagRoles);
    } catch (error) {
      reject(error);
    }
  });
}

export async function getRoleRights() {
  if (state.rights) {
    return Promise.resolve(state.rights);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const rights = await connection.select("*").from("roles_rights");
      state.rights = rights;
      resolve(rights);
    } catch (error) {
      reject(error);
    }
  });
}

export const getRoles = async (): Promise<[BlogRole]> => {
  if (state?.roles?.length) {
    return state.roles;
  }
  const connection = await getConnection();
  const qRes = await connection.select("*").from("roles");
  const roles = qRes.map((row) => ({
    id: row.id,
    name: row.name,
  }));
  state.roles = roles;
  return state.roles;
};
