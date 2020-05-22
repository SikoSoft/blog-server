const { db, jsonReply, processEntry } = require("../util.js");

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    await connection
      .query("SELECT entry_id FROM entries_tags WHERE tag = ?", [
        context.bindingData.tag,
      ])
      .then(async (tagEntries) => {
        const entriesWithTag = tagEntries.map((tagEntry) => tagEntry.entry_id);

        console.log("tagEntries", tagEntries);
        await connection
          .query(
            `SELECT * FROM entries_tags WHERE ${[...tagEntries]
              .fill("entry_id = ?")
              .join(" || ")}`,
            entriesWithTag
          )
          .then(async (entriesTags) => {
            console.log("entriesWithTag", entriesWithTag);
            await connection
              .query(
                `SELECT * FROM entries WHERE (${[...entriesWithTag]
                  .fill("id = ?")
                  .join(" || ")}) && public = 1 ORDER BY created DESC`,
                entriesWithTag
              )
              .then((entries) => {
                console.log("entries", entries);
                jsonReply(context, {
                  entries: entries.map((entry) =>
                    processEntry(req, entry, entriesTags)
                  ),
                });
              });
          });
      });
  });
};
