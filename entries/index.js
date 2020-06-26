const { db, getSettings, processEntry, getLastEntry } = require("../util");

module.exports = async function (context, req) {
  await getSettings().then(async (settings) => {
    await db.getConnection().then(async (connection) => {
      const query = `SELECT * FROM entries WHERE public = ?`;
      const queryArgs = [req.drafts ? 0 : 1];
      await getLastEntry(query, queryArgs).then(async (lastEntryId) => {
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
                      [req.drafts
                        ? "drafts"
                        : "entries"]: entries.map((entry) =>
                        processEntry(req, entry, tags)
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
      });
    });
  });
};
