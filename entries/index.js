const {
  db,
  getSettings,
  processEntry,
  getLastEntry,
  jsonReply,
} = require("../util");

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
          .then(async (rawEntries) => {
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
          });
      });
    });
  });
};
