import { URL } from "url";
import {getConnection} from "./database";
import spec from "blog-spec";
import { Context } from "@azure/functions";

/*const URL = require("url").URL;
const fetch = require("node-fetch");
const queryString = require("query-string");
const db = require("./database");
const spec = require("blog-spec");
*/

const initialState = {
  session: {},
  excludedEntries: {},
};

let state = { ...JSON.parse(JSON.stringify(initialState)) };

function pad(x, padding = 2) {
  return x.toString().padStart(padding, "0");
}

function shortDate(time = new Date()) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function baseUrl(req) {
  const url = new URL(req.originalUrl);
  const pathDirs = url.pathname.split("/");
  return `${url.origin}${pathDirs
    .slice(0, pathDirs.length - Object.keys(req.params).length - 1)
    .join("/")}`;
}

function getEndpoint(endpoint, req) {
  return {
    href: `${baseUrl(req)}/${endpoint.href}`,
    method: endpoint.method,
    key: req.headers.key ? req.headers.key : "",
  };
}

function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function getSettings() {
  if (state.settings) {
    return Promise.resolve(state.settings);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const settingsRows = await connection.select("*").from("settings");
      const settings = {};
      console.log("###################SETTINGS################", spec);
      for (const setting of spec.settings) {
        const matchedRow = settingsRows.filter(
          (settingRow) => settingRow.id === setting.id
        );
        settings[setting.id] = matchedRow.length
          ? matchedRow[0][
              spec.typeMap[setting.dataType ? setting.dataType : setting.type]
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

async function getTagRoles() {
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

async function getRoleRights() {
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

async function getSessionRole(sessToken = "") {
  if (state.session[sessToken] && state.session[sessToken].role) {
    return Promise.resolve(state.session[sessToken].role);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const settings = await getSettings();
      if (!sessToken) {
        resolve(settings.role_guest);
        return;
      }
      let role = settings.role_guest;
      const connection = await getConnection();
      const [session] = await connection
        .select("*")
        .from("tokens_consumed")
        .join("tokens", "tokens.code", "=", "tokens_consumed.code")
        .where("tokens_consumed.session", sessToken);

      if (session) {
        role = session.role;
      }
      state.session[sessToken] = state.session[sessToken]
        ? { ...state.session[sessToken], role }
        : { role };
      resolve(role);
    } catch (error) {
      reject(error);
    }
  });
}

async function getSessionRights(sessToken) {
  if (state.session[sessToken] && state.session[sessToken].rights) {
    return Promise.resolve(state.session[sessToken].rights);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const rights = await getRoleRights();
      const role = await getSessionRole(sessToken);
      const sessionRights = rights
        .filter((right) => role === right.role)
        .map((right) => right.action);
      state.session[sessToken] = state.session[sessToken]
        ? { ...state.session[sessToken], rights: sessionRights }
        : { rights: sessionRights };
      resolve(sessionRights);
    } catch (error) {
      reject(error);
    }
  });
}

async function getEntriesTags() {
  if (state.entriesTags) {
    return Promise.resolve(state.entriesTags);
  }
  return new Promise(async (resolve) => {
    const connection = await getConnection();
    const tagRows = await connection
      .select("*")
      .from("entries_tags")
      .orderBy("entry_id", "tag");
    const entriesTags = {};
    tagRows.forEach((tagRow) => {
      entriesTags[tagRow.entry_id] = [
        ...(entriesTags[tagRow.entry_id] ? entriesTags[tagRow.entry_id] : []),
        tagRow.tag,
      ];
    });
    state.entriesTags = entriesTags;
    resolve(entriesTags);
  });
}

async function getFurtherReading(entryId) {
  const settings = await getSettings();
  if (settings.further_reading_min_tags === 0) {
    return [];
  }
  const furtherReading = [];
  const entriesTags = await getEntriesTags();
  Object.keys(entriesTags).forEach((id) => {
    const matches = entriesTags[id].filter((tag) =>
      typeof entriesTags[entryId] !== "undefined"
        ? entriesTags[entryId].indexOf(tag) !== -1
        : false
    );
    if (id !== entryId && matches.length >= settings.further_reading_min_tags) {
      furtherReading.push(id);
    }
  });
  return furtherReading;
}

const jsonReply = (context: Context, object: Object): void => {
  context.res = {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(object),
  };
}

export {
  getConnection,

  baseUrl,

  shortDate,

  getEndpoint,

  getSettings,

  getTagRoles,

  getRoleRights,

  getSessionRole,

  getSessionRights,

  getEntriesTags,

  jsonReply

}

export default {
  getConnection,

  baseUrl,

  shortDate,

  getEndpoint,

  getSettings,

  getTagRoles,

  getRoleRights,

  getSessionRole,

  getSessionRights,

  getEntriesTags,

  jsonReply,

  getId: async (title) => {
    return new Promise(async (resolve, reject) => {
      try {
        const connection = await getConnection();
        const id = sanitizeTitle(title);
        const qRes = await connection
          .count("* as total")
          .from("entries")
          .where("id", "REGEXP", `%${id}%`);
        resolve(qRes[0].total === 0 ? id : `${id}-${qRes[0].total + 1}`);
      } catch (error) {
        reject(error);
      }
    });
  },

  getIp: (req) => {
    return req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].replace(/:[0-9]+/, "")
      : "0.0.0.0";
  },

  verifyCaptcha: async (response, ip) => {
    return Promise.resolve();
    /*
    if (!process.env.RECAPTCHA_SECRET) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: queryString.stringify({
          secret: process.env.RECAPTCHA_SECRET,
          response,
          remoteip: ip,
        }),
      })
        .then((response) => response.json())
        .then((json) => {
          resolve(json);
        })
        .catch((e) => reject(e));
    });
    */
  },

  getTextFromDelta(delta) {
    return delta.reduce((accumulator, op) => {
      if (typeof op.insert === "string") {
        return accumulator + op.insert;
      }
    }, "");
  },

  flushState: (key) => {
    if (key) {
      delete state[key];
    } else {
      state = { ...JSON.parse(JSON.stringify(initialState)) };
    }
  },

  processEntry: async (req, entry) => {
    return new Promise(async (resolve) => {
      const tags = await getEntriesTags();
      const endpoint = `entry/${entry.id}`;
      const furtherReading = await getFurtherReading(entry.id);
      const rights = await getSessionRights(req.headers["sess-token"]);
      resolve({
        ...entry,
        furtherReading,
        tags: tags[entry.id] ? tags[entry.id] : [],
        links: {
          view: getEndpoint({ href: endpoint, method: "GET" }, req),
          ...(rights.includes("update_entry")
            ? { save: getEndpoint({ href: endpoint, method: "PUT" }, req) }
            : {}),
          ...(rights.includes("delete_entry")
            ? { delete: getEndpoint({ href: endpoint, method: "DELETE" }, req) }
            : {}),
          postComment: getEndpoint(
            {
              href: `postComment/${entry.id}`,
              method: "POST",
            },
            req
          ),
          getComments: getEndpoint(
            {
              href: `comments/${entry.id}`,
              method: "GET",
            },
            req
          ),
          ...(rights.includes("publish_comment")
            ? {
                publishComments: getEndpoint(
                  {
                    href: "publishComments",
                    method: "POST",
                  },
                  req
                ),
              }
            : {}),
          ...(rights.includes("delete_comment")
            ? {
                deleteComments: getEndpoint(
                  {
                    href: "deleteComments",
                    method: "POST",
                  },
                  req
                ),
              }
            : {}),
          uploadImage: getEndpoint(
            {
              href: "uploadImage/{type}",
              method: "POST",
            },
            req
          ),
        },
      });
    });
  },

  getLastEntry: async (query, queryArgs) => {
    return Promise.resolve();
    /*
    return new Promise(async (resolve) => {
      const connection = await db.getConnection();
      const lastEntry = await connection.query(
        `${query} ORDER BY created ASC LIMIT 1`,
        queryArgs
      );
      resolve(lastEntry.length ? lastEntry[0].id : -1);
    });
    */
  },

  getExcludedEntries: async (sessToken = "") => {
    if (state.excludedEntries && state.excludedEntries[sessToken]) {
      return Promise.resolve(state.excludedEntries[sessToken]);
    }
    return new Promise(async (resolve, reject) => {
      try {
        const connection = await getConnection();
        const idRows = await connection.select("id").from("entries");
        const role = await getSessionRole(sessToken);
        const tagRoles = await getTagRoles();
        const entriesTags = await getEntriesTags();
        const allIds = idRows.map((idRow) => idRow.id);
        const excludedEntries = allIds.filter((id) => {
          if (entriesTags[id]) {
            let allowedForAllTags = true;
            entriesTags[id].forEach((entryTag) => {
              if (
                tagRoles[entryTag] &&
                tagRoles[entryTag].indexOf(role) === -1
              ) {
                allowedForAllTags = false;
              }
            });
            if (!allowedForAllTags) {
              return true;
            }
          }
          return false;
        });
        state.excludedEntries[sessToken] = excludedEntries;
        resolve(excludedEntries);
      } catch (error) {
        reject(error);
      }
    });
  },
};
