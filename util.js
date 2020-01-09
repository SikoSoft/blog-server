const URL = require("url").URL;
const db = require("./database");

function pad(x, padding = 2) {
  return x.toString().padStart(padding, "0");
}

function shortDate(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9\-]/, "");
}

module.exports = {
  db,

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
  }
};
