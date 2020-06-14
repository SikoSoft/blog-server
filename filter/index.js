const {
  db,
  jsonReply,
  processEntry,
  getSettings,
  getLastEntry,
} = require("../util.js");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await getSettings().then(async (settings) => {
    await db.getConnection().then(async (connection) => {
      if (req.method === "POST") {
        await db.getConnection().then(async (connection) => {
          await connection
            .query("INSERT INTO filters (id, label) VALUES(?, ?)", [
              body.id,
              body.label,
            ])
            .then(async (res) => {
              jsonReply(context, { success: res.affectedRows === 1 });
            });
        });
      } else if (req.method === "PUT") {
        await db.getConnection().then(async (connection) => {
          await connection
            .query("UPDATE filters SET id = ?, label = ? WHERE id = ?", [
              body.newId,
              body.label,
              body.id,
            ])
            .then(async (res) => {
              jsonReply(context, { success: res.affectedRows === 1 });
            });
        });
      } else if (req.method === "DELETE") {
      } else {
        await connection
          .query("SELECT * FROM filters_rules WHERE filter_id = ?", [
            context.bindingData.id,
          ])
          .then(async (rules) => {
            const tagsToCheck = [];
            rules.forEach((filter) => {
              if (filter.type === "tag") {
                tagsToCheck.push(filter.value);
              }
            });
            let entriesTags = {};
            await connection
              .query(
                `SELECT * FROM entries_tags WHERE ${[...tagsToCheck]
                  .fill("tag = ?")
                  .join(" || ")}`,
                tagsToCheck
              )
              .then(async (tagsRows) => {
                tagsRows.forEach((tagRow) => {
                  entriesTags[tagRow.entry_id] = entriesTags[tagRow.entry_id]
                    ? [...entriesTags[tagRow.entry_id], tagRow.tag]
                    : [tagRow.tag];
                });
              });
            const filteredByTags = [];
            Object.keys(entriesTags).forEach((entryId) => {
              let matchesAll = true;
              rules.forEach((filter) => {
                if (filter.type === "tag") {
                  if (
                    !(
                      filter.operator === "=" &&
                      entriesTags[entryId].includes(filter.value)
                    ) &&
                    !(
                      filter.operator === "!=" &&
                      !entriesTags[entryId].includes(filter.value)
                    )
                  ) {
                    matchesAll = false;
                  }
                }
              });
              if (matchesAll) {
                filteredByTags.push(entryId);
              }
            });
            const query = `SELECT * FROM entries WHERE ${[...filteredByTags]
              .fill("id = ?")
              .join(" || ")}`;
            await getLastEntry(query, filteredByTags).then(
              async (lastEntryId) => {
                const limit = `LIMIT ${
                  context.bindingData.start
                    ? parseInt(context.bindingData.start)
                    : 0
                }, ${settings.per_load ? settings.per_load : 10}`;
                await connection
                  .query(
                    `${query} ORDER BY created DESC ${limit}`,
                    filteredByTags
                  )
                  .then(async (entries) => {
                    let tagQuery = `SELECT * FROM entries_tags WHERE ${[
                      ...entries,
                    ]
                      .fill("entry_id = ?")
                      .join(" || ")}`;
                    await connection
                      .query(
                        tagQuery,
                        entries.map((entry) => entry.id)
                      )
                      .then((tags) => {
                        jsonReply(context, {
                          entries: entries.map((entry) =>
                            processEntry(req, entry, tags)
                          ),
                          end:
                            entries.length === 0
                              ? true
                              : entries[entries.length - 1].id === lastEntryId,
                        });
                      });
                  });
              }
            );
          });
      }
    });
  });
};
