const {
  db,
  jsonReply,
  processEntry,
  getSettings,
  getLastEntry,
} = require("../util.js");

module.exports = async function (context, req) {
  const settings = await getSettings();
  const connection = await db.getConnection();
  const tagEntries = await connection.query(
    "SELECT entry_id FROM entries_tags WHERE tag = ?",
    [context.bindingData.tag]
  );

  const entriesWithTag = tagEntries.map((tagEntry) => tagEntry.entry_id);

  const query = `SELECT * FROM entries WHERE (${[...entriesWithTag]
    .fill("id = ?")
    .join(" || ")}) && public = 1`;
  const lastEntryId = await getLastEntry(query, entriesWithTag);
  const limit = `LIMIT ${
    context.bindingData.start ? parseInt(context.bindingData.start) : 0
  }, ${settings.per_load ? settings.per_load : 10}`;
  const rawEntries = await connection.query(
    `${query} ORDER BY created DESC ${limit}`,
    entriesWithTag
  );

  const processedEntries = rawEntries.map((entry) => processEntry(req, entry));
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
};
