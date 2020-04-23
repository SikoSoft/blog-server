const { db, baseUrl, getEndpoint, getSettings } = require("../util");

const getLastEntry = async (connection, query, queryArgs) => {
  return new Promise((resolve, reject) => {
    connection
      .query(`${query} ORDER BY created ASC LIMIT 1`, queryArgs)
      .then((lastEntry) => {
        resolve(lastEntry[0].id);
      });
  });
};

const processEntries = (entries, tags, req) => {
  return entries.map((entry) => {
    const originalUrl = req.originalUrl.replace(/\/[0-9]+$/, "");
    const endpoint = `${baseUrl(originalUrl)}/entry/${entry.id}`;
    return {
      ...entry,
      tags: tags
        .filter((tagRow) => tagRow.entry_id === entry.id)
        .map((tagRow) => tagRow.tag),
      api: {
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
  });
};

module.exports = async function (context, req) {
  await getSettings().then(async (settings) => {
    await db.getConnection().then(async (connection) => {
      const query = `SELECT * FROM entries WHERE public = ?`;
      const queryArgs = [req.drafts ? 0 : 1];
      await getLastEntry(connection, query, queryArgs).then(
        async (lastEntryId) => {
          const limit = `LIMIT ${
            context.bindingData.start ? parseInt(context.bindingData.start) : 0
          }, ${settings.per_load ? settings.per_load : 10}`;
          await connection
            .query(`${query} ORDER BY created DESC ${limit}`, queryArgs)
            .then(async (entries) => {
              if (entries.length) {
                let tagQuery = `SELECT * FROM entries_tags WHERE ${[...entries]
                  .fill("entry_id = ?")
                  .join(" || ")}`;
                await connection
                  .query(
                    tagQuery,
                    entries.map((entry) => entry.id)
                  )
                  .then((tags) => {
                    context.res = {
                      status: 200,
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        [req.drafts ? "drafts" : "entries"]: processEntries(
                          entries,
                          tags,
                          req
                        ),
                        end: entries[entries.length - 1].id === lastEntryId,
                      }),
                    };
                  });
              } else {
                context.res = {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    [req.drafts ? "drafts" : "entries"]: [],
                    end: true,
                  }),
                };
              }
            });
        }
      );
    });
  });
};
