const {
  db,
  jsonReply,
  processEntry,
  getSettings,
  getLastEntry,
} = require("../util.js");

module.exports = async function (context, req) {
  await getSettings().then(async (settings) => {
    await db.getConnection().then(async (connection) => {
      await connection
        .query("SELECT entry_id FROM entries_tags WHERE tag = ?", [
          context.bindingData.tag,
        ])
        .then(async (tagEntries) => {
          const entriesWithTag = tagEntries.map(
            (tagEntry) => tagEntry.entry_id
          );
          await connection
            .query(
              `SELECT * FROM entries_tags WHERE ${[...tagEntries]
                .fill("entry_id = ?")
                .join(" || ")}`,
              entriesWithTag
            )
            .then(async (entriesTags) => {
              const query = `SELECT * FROM entries WHERE (${[...entriesWithTag]
                .fill("id = ?")
                .join(" || ")}) && public = 1`;
              await getLastEntry(query, entriesWithTag).then(
                async (lastEntryId) => {
                  const limit = `LIMIT ${
                    context.bindingData.start
                      ? parseInt(context.bindingData.start)
                      : 0
                  }, ${settings.per_load ? settings.per_load : 10}`;
                  await connection
                    .query(
                      `${query} ORDER BY created DESC ${limit}`,
                      entriesWithTag
                    )
                    .then((entries) => {
                      jsonReply(context, {
                        entries: entries.map((entry) =>
                          processEntry(req, entry, entriesTags)
                        ),
                        end:
                          entries.length === 0
                            ? true
                            : entries[entries.length - 1].id === lastEntryId,
                      });
                    });
                }
              );
            });
        });
    });
  });
};
