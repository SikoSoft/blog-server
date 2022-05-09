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
  const settings = await getSettings();
  const connection = await db.getConnection();
  if (req.method === "POST") {
    await connection
      .query("INSERT INTO filters (id, label, image) VALUES(?, ?, ?)", [
        body.id,
        body.label,
        body.image,
      ])
      .then(async (res) => {
        jsonReply(context, { success: res.affectedRows === 1 });
      });
  } else if (req.method === "PUT") {
    const res = await connection.query(
      "UPDATE filters SET id = ?, label = ?, image = ? WHERE id = ?",
      [body.newId, body.label, body.image, body.id]
    );

    jsonReply(context, { success: res.affectedRows === 1 });
  } else if (req.method === "DELETE") {
    const res = await connection.query("DELETE FROM filters WHERE id = ?", [
      context.bindingData.id,
    ]);
    jsonReply(context, { success: res.affectedRows === 1 });
  } else {
    const rules = await connection.query(
      "SELECT * FROM filters_rules WHERE filter_id = ?",
      [context.bindingData.id]
    );

    const tagsToCheck = [];
    rules.forEach((filter) => {
      if (filter.type === "tag") {
        tagsToCheck.push(filter.value);
      }
    });
    let entriesTags = {};
    const tagsRows = await connection.query(
      `SELECT * FROM entries_tags WHERE ${[...tagsToCheck]
        .fill("tag = ?")
        .join(" || ")}`,
      tagsToCheck
    );

    tagsRows.forEach((tagRow) => {
      entriesTags[tagRow.entry_id] = entriesTags[tagRow.entry_id]
        ? [...entriesTags[tagRow.entry_id], tagRow.tag]
        : [tagRow.tag];
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
    const query = `SELECT * FROM entries WHERE listed = 1 && (${[
      ...filteredByTags,
    ]
      .fill("id = ?")
      .join(" || ")})`;
    const lastEntryId = await getLastEntry(query, filteredByTags);
    const limit = `LIMIT ${
      context.bindingData.start ? parseInt(context.bindingData.start) : 0
    }, ${settings.per_load ? settings.per_load : 10}`;
    const rawEntries = await connection.query(
      `${query} ORDER BY created DESC ${limit}`,
      filteredByTags
    );

    const processedEntries = rawEntries.map((entry) =>
      processEntry(req, entry)
    );
    await Promise.all(processedEntries);
    const entries = [];
    await processedEntries.forEach(async (entry) => {
      await entry.then((data) => entries.push(data));
    });

    jsonReply(context, {
      entries,
      end:
        entries.length === 0
          ? true
          : entries[entries.length - 1].id === lastEntryId,
    });
  }
};
