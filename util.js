const URL = require("url").URL;
const fetch = require("node-fetch");
const queryString = require("query-string");
const db = require("./database");

function pad(x, padding = 2) {
  return x.toString().padStart(padding, "0");
}

function shortDate(time = new Date()) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

module.exports = {
  db,

  shortDate,

  jsonReply: (context, object) => {
    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(object)
    };
  },

  baseUrl: urlString => {
    const url = new URL(urlString);
    const pathDirs = url.pathname.split("/");
    return `${url.origin}${pathDirs.slice(0, pathDirs.length - 1).join("/")}`;
  },

  getId: async title => {
    return new Promise((resolve, reject) => {
      db.getConnection()
        .then(async connection => {
          let id = sanitizeTitle(title);
          connection
            .query("SELECT COUNT(*) AS total FROM entries WHERE id REGEXP ?", [
              id
            ])
            .then(qRes => {
              resolve(qRes[0].total === 0 ? id : `${id}-${qRes[0].total + 1}`);
            })
            .catch(e => reject(e));
        })
        .catch(e => reject(e));
    });
  },

  getEndpoint: (endpoint, req) => ({
    ...endpoint,
    key: req.headers.key ? req.headers.key : ""
  }),

  getIp: req => {
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
          "content-type": "application/x-www-form-urlencoded"
        },
        body: queryString.stringify({
          secret: process.env.RECAPTCHA_SECRET,
          response,
          remoteip: ip
        })
      })
        .then(response => response.json())
        .then(json => {
          resolve(json);
        })
        .catch(e => reject(e));
    });
  },

  getTextFromDelta(delta) {
    return delta.reduce((accumulator, op) => {
      if (typeof op.insert === "string") {
        return accumulator + op.insert;
      }
    }, "");
  }
};
