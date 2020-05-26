const URL = require("url").URL;
const fetch = require("node-fetch");
const queryString = require("query-string");
const db = require("./database");

const initialState = {
  session: {},
};

let state = { ...initialState };

function pad(x, padding = 2) {
  return x.toString().padStart(padding, "0");
}

function shortDate(time = new Date()) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function baseUrl(urlString) {
  const url = new URL(urlString);
  const pathDirs = url.pathname.split("/");
  return `${url.origin}${pathDirs.slice(0, pathDirs.length - 1).join("/")}`;
}

function getEndpoint(endpoint, req) {
  return {
    ...endpoint,
    key: req.headers.key ? req.headers.key : "",
  };
}

function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

async function getSettings() {
  if (state.settings) {
    return Promise.resolve(state.settings);
  }
  return new Promise((resolve, reject) => {
    db.getConnection()
      .then((connection) => {
        connection.query("SELECT * FROM settings").then(([settings]) => {
          state.settings = settings;
          resolve(settings);
        });
      })
      .catch((error) => reject(error));
  });
}

async function getRoleRights() {
  if (state.rights) {
    return Promise.resolve(state.rights);
  }
  return new Promise((resolve, reject) => {
    db.getConnection()
      .then((connection) => {
        connection.query("SELECT * FROM roles_rights").then((rights) => {
          state.rights = rights;
          resolve(rights);
        });
      })
      .catch((error) => reject(error));
  });
}

async function getSessionRole(sessToken) {
  if (state.session[sessToken] && state.session[sessToken].role) {
    return Promise.resolve(state.session[sessToken].role);
  }
  return new Promise((resolve, reject) => {
    getSettings().then((settings) => {
      if (!sessToken) {
        resolve(settings.role_guest);
      }
      let role = settings.role_guest;
      db.getConnection()
        .then((connection) => {
          connection
            .query(
              "SELECT * FROM tokens_consumed as c, tokens as t WHERE c.session = ? && t.token = c.token",
              [sessToken]
            )
            .then(([session]) => {
              if (session) {
                role = session.role;
              }
              state.session[sessToken] = state.session[sessToken]
                ? { ...state.session[sessToken], role }
                : { role };
              resolve(role);
            });
        })
        .catch((error) => reject(error));
    });
  });
}

async function getSessionRights(sessToken) {
  if (state.session[sessToken] && state.session[sessToken].rights) {
    return Promise.resolve(state.session[sessToken].rights);
  }
  return new Promise((resolve, reject) => {
    getRoleRights()
      .then((rights) => {
        getSessionRole(sessToken).then((role) => {
          const sessionRights = rights
            .filter((right) => role === right.role)
            .map((right) => right.action);
          state.session[sessToken] = state.session[sessToken]
            ? { ...state.session[sessToken], rights: sessionRights }
            : { rights: sessionRights };
          resolve(sessionRights);
        });
      })
      .catch((error) => reject(error));
  });
}

module.exports = {
  db,

  baseUrl,

  shortDate,

  getEndpoint,

  getSettings,

  getRoleRights,

  getSessionRole,

  getSessionRights,

  jsonReply: (context, object) => {
    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(object),
    };
  },

  getId: async (title) => {
    return new Promise((resolve, reject) => {
      db.getConnection()
        .then(async (connection) => {
          let id = sanitizeTitle(title);
          connection
            .query("SELECT COUNT(*) AS total FROM entries WHERE id REGEXP ?", [
              id,
            ])
            .then((qRes) => {
              resolve(qRes[0].total === 0 ? id : `${id}-${qRes[0].total + 1}`);
            })
            .catch((e) => reject(e));
        })
        .catch((e) => reject(e));
    });
  },

  getIp: (req) => {
    return req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].replace(/:[0-9]+/, "")
      : "0.0.0.0";
  },

  verifyCaptcha: async (response, ip) => {
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
      state = { ...initialState };
    }
  },

  processEntry: (req, entry, tags) => {
    const originalUrl = req.originalUrl.replace(/(\/[0-9]+$|entry\/)/, "");
    const endpoint = `${baseUrl(originalUrl)}/entry/${entry.id}`;
    return {
      ...entry,
      tags: tags
        .filter((tagRow) => tagRow.entry_id === entry.id)
        .map((tagRow) => tagRow.tag),
      api: {
        view: getEndpoint({ href: endpoint, method: "GET" }, req),
        save: getEndpoint({ href: endpoint, method: "PUT" }, req),
        delete: getEndpoint({ href: endpoint, method: "DELETE" }, req),
        postComment: getEndpoint(
          {
            href: `${baseUrl(originalUrl)}/postComment/${entry.id}`,
            method: "POST",
          },
          req
        ),
        getComments: getEndpoint(
          {
            href: `${baseUrl(originalUrl)}/comments/${entry.id}`,
            method: "GET",
          },
          req
        ),
        publishComments: getEndpoint(
          {
            href: `${baseUrl(originalUrl)}/publishComments`,
            method: "POST",
          },
          req
        ),
        deleteComments: getEndpoint(
          {
            href: `${baseUrl(originalUrl)}/deleteComments`,
            method: "POST",
          },
          req
        ),
      },
    };
  },
};
