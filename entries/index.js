const {
  db,
  getSettings,
  getTagRights,
  processEntry,
  getLastEntry,
  jsonReply,
  getExcludedEntries,
} = require("../util");

module.exports = async function (context, req) {
  const settings = await getSettings();
  const connection = await db.getConnection();
  const excludedEntries = await getExcludedEntries(req.headers["sess-token"]);
  const query = `SELECT * FROM entries WHERE public = ? ${
    (excludedEntries.length ? " AND " : "") +
    excludedEntries.map((excludedId) => `id != '${excludedId}'`).join(" AND ")
  }`;
  const queryArgs = [req.drafts ? 0 : 1];
  const lastEntryId = await getLastEntry(query, queryArgs);
  const limit = `LIMIT ${
    context.bindingData.start ? parseInt(context.bindingData.start) : 0
  }, ${settings.per_load ? settings.per_load : 10}`;
  const rawEntries = await connection.query(
    `${query} ORDER BY created DESC ${limit}`,
    queryArgs
  );

  if (rawEntries.length) {
    const processedEntries = rawEntries.map((entry) =>
      processEntry(req, entry)
    );
    await Promise.all(processedEntries);
    const entries = [];
    await processedEntries.forEach(async (entry) => {
      await entry.then((data) => entries.push(data));
    });
    jsonReply(context, {
      [req.drafts ? "drafts" : "entries"]: entries,
      end: rawEntries[rawEntries.length - 1].id === lastEntryId,
    });
  } else {
    jsonReply(context, {
      [req.drafts ? "drafts" : "entries"]: [],
      end: true,
    });
  }
};
