const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    await connection
      .query("SELECT * FROM filters_rules ORDER BY filter_id")
      .then(async (rows) => {
        jsonReply(context, { rules: rows });
      });
  });
};
