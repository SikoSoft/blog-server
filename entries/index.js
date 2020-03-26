const { db, baseUrl, getEndpoint } = require("../util");

const processEntries = (entries, tags, req) => {
  return entries.map(entry => {
    const endpoint = `${baseUrl(req.originalUrl)}/entry/${entry.id}`;
    return {
      ...entry,
      tags: tags
        .filter(tagRow => tagRow.entry_id === entry.id)
        .map(tagRow => tagRow.tag),
      api: {
        save: getEndpoint({ href: endpoint, method: "PUT" }, req),
        delete: getEndpoint({ href: endpoint, method: "DELETE" }, req),
        postComment: getEndpoint(
          {
            href: `${baseUrl(req.originalUrl)}/postComment/${entry.id}`,
            method: "POST"
          },
          req
        ),
        getComments: getEndpoint(
          {
            href: `${baseUrl(req.originalUrl)}/comments/${entry.id}`,
            method: "GET"
          },
          req
        ),
        publishComments: getEndpoint(
          {
            href: `${baseUrl(req.originalUrl)}/publishComments`,
            method: "POST"
          },
          req
        ),
        deleteComments: getEndpoint(
          {
            href: `${baseUrl(req.originalUrl)}/deleteComments`,
            method: "POST"
          },
          req
        )
      }
    };
  });
};

module.exports = async function(context, req) {
  await db.getConnection().then(async connection => {
    await connection
      .query("SELECT * FROM entries WHERE public = ? ORDER BY created DESC", [
        req.drafts ? 0 : 1
      ])
      .then(async entries => {
        if (entries.length) {
          let tagQuery = `SELECT * FROM entries_tags WHERE ${[...entries]
            .fill("entry_id = ?")
            .join(" || ")}`;
          await connection
            .query(
              tagQuery,
              entries.map(entry => entry.id)
            )
            .then(tags => {
              context.res = {
                status: 200,
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  entries: processEntries(entries, tags, req)
                })
              };
            });
        } else {
          context.res = {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              entries: []
            })
          };
        }
      });
  });
};
