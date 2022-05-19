import { URL } from "url";
import axios from "axios";
import { getConnection } from "./database";
import spec = require("blog-spec");
import { Context, HttpRequest } from "@azure/functions";
import { BlogEntry } from "./interfaces/BlogEntry";
import { stringify } from "query-string";
import { BlogLink } from "./interfaces/BlogLink";
import linkMap from "./linkMap";

const initialState = {
  session: {},
  excludedEntries: {},
};

let state = { ...JSON.parse(JSON.stringify(initialState)) };

function pad(x: number, padding: number = 2): string {
  return x.toString().padStart(padding, "0");
}

function shortDate(time: Date = new Date()): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function baseUrl(req): string {
  const url = new URL(req.originalUrl);
  const pathDirs = url.pathname.split("/");
  return `${url.origin}${pathDirs
    .slice(0, pathDirs.length - Object.keys(req.params).length - 1)
    .join("/")}`;
}

function getEndpoint(req: HttpRequest, endpoint: BlogLink): BlogLink {
  return {
    rel: endpoint.rel,
    entity: endpoint.entity,
    href: `${baseUrl(req)}/${endpoint.href}`,
    method: endpoint.method,
    key: req.headers.key ? req.headers.key : "",
  };
}

function getLinks(
  req: HttpRequest,
  entities: string | string[],
  id?: any | any[],
  rel?: string
): Array<BlogLink> {
  const ids =
    typeof id === "undefined" ? [] : typeof id !== "object" ? [id] : id;
  return [...(typeof entities === "string" ? [entities] : entities)]
    .map((entity) => {
      const links = [];
      if (linkMap[entity]) {
        const entityParams = linkMap[entity].params || [];
        let methods = linkMap[entity].methods;
        console.log(
          "ids",
          ids,
          "idsLength",
          ids.length,
          "entityParams",
          entityParams,
          "lastParam",
          entityParams[entityParams.length - 1]
        );
        if (
          ids.length &&
          (entityParams[entityParams.length - 1] === entity || false)
        ) {
          methods = methods.filter((method) => method !== "POST");
        } else {
          methods = methods.filter(
            (method) => method === "POST" || method === "GET"
          );
        }
        for (const method of methods) {
          links.push(
            getEndpoint(req, {
              entity,
              href: `${entity}${id ? "/" + ids.join("/") : ""}`,
              method,
              rel,
            })
          );
        }
      }
      return links;
    })
    .reduce((prev, cur) => [...prev, ...cur], []);
}

function contextIsValid(id: string): boolean {
  return spec.contexts.filter((context) => id === context.id).length > 0;
}

function getContextLinks(req: HttpRequest): Array<BlogLink> {
  const context = req.headers.context ? JSON.parse(req.headers.context) : [];
  return context
    .filter((context) => contextIsValid(context.id))
    .map((context) =>
      context?.props?.length
        ? getLinks(req, context.props[0], context.props[1], context.id)
        : []
    )
    .reduce((prev, cur) => [...prev, ...cur], []);
}

function sanitizeTitle(title: string): string {
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

async function getSessionRole(sessToken: string = "") {
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

async function getFurtherReading(entryId: string) {
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

const jsonReply = (
  context: Context,
  object: Object = {},
  status: number = 200
): void => {
  context.res = {
    status,
    headers: {
      "content-type": "application/json",
    },
    ...(Object.keys(object).length ? { body: JSON.stringify(object) } : {}),
  };
};

const getLastEntry = async (query: any): Promise<any> => {
  return new Promise(async (resolve): Promise<any> => {
    try {
      const entry = await query.orderBy("created", "asc").limit(1).first();
      resolve(entry?.id ? entry.id : "");
    } catch (error) {
      console.error(error);
    }
  });
};

const getExcludedEntries = async (sessToken: string = ""): Promise<any> => {
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
            if (tagRoles[entryTag] && tagRoles[entryTag].indexOf(role) === -1) {
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
};

const processEntry = async (
  req: HttpRequest,
  entry: BlogEntry
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tags = await getEntriesTags();
      const furtherReading = await getFurtherReading(entry.id);
      resolve({
        ...entry,
        furtherReading,
        tags: tags[entry.id] ? tags[entry.id] : [],
        links: [
          ...getLinks(req, ["entry", "comments"], entry.id),
          ...getLinks(req, ["comment"]),
        ],
        /*
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
*/
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getIp = (req: HttpRequest): string => {
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].replace(/:[0-9]+/, "")
    : "0.0.0.0";
};

const verifyCaptcha = async (response, ip: string): Promise<any> => {
  if (!process.env.RECAPTCHA_SECRET) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    axios
      .post<any>(
        "https://www.google.com/recaptcha/api/siteverify",
        stringify({
          secret: process.env.RECAPTCHA_SECRET,
          response,
          remoteip: ip,
        }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((e) => {
        reject(e);
      });
  });
};

const flushState = (key?: string): void => {
  if (key) {
    delete state[key];
  } else {
    state = { ...JSON.parse(JSON.stringify(initialState)) };
  }
};

const getTextFromDelta = (delta): any => {
  return delta.reduce((accumulator, op) => {
    if (typeof op.insert === "string") {
      return accumulator + op.insert;
    }
  }, "");
};

const getId = async (title: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const id = sanitizeTitle(title);
      const qRes = await connection
        .count("* as total")
        .from("entries")
        .where("id", "REGEXP", `%${id}%`)
        .first();
      resolve(qRes.total === 0 ? id : `${id}-${qRes.total + 1}`);
    } catch (error) {
      reject(error);
    }
  });
};

export {
  getConnection,
  baseUrl,
  shortDate,
  getEndpoint,
  getLinks,
  getContextLinks,
  getSettings,
  getTagRoles,
  getRoleRights,
  getSessionRole,
  getSessionRights,
  getEntriesTags,
  jsonReply,
  getLastEntry,
  getExcludedEntries,
  processEntry,
  getIp,
  getId,
  verifyCaptcha,
  flushState,
  getTextFromDelta,
};
