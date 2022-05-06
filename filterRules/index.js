const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  const rows = await connection.query(
    "SELECT * FROM filters_rules ORDER BY filter_id"
  );
  jsonReply(context, { rules: rows });
};
