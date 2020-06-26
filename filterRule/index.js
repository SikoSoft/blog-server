const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await db.getConnection().then(async (connection) => {
    if (req.method === "POST") {
      await connection
        .query(
          "INSERT INTO filters_rules (filter_id, type, value, operator) VALUES(?, ?, ?, ?)",
          [context.bindingData.entryId, body.type, body.value, body.operator]
        )
        .then(async (res) => {
          jsonReply(context, { id: res.insertId, success: true });
        });
    } else if (req.method === "PUT") {
      await connection
        .query(
          "REPLACE INTO filters_rules (filter_id, type, value, operator) VALUES(?, ?, ?, ?)",
          [context.bindingData.entryId, body.type, body.value, body.operator]
        )
        .then(async () => {
          jsonReply(context, { success: true });
        });
    } else if (req.method === "DELETE") {
      await connection
        .query("DELETE FROM filters_rules WHERE id = ?", [body.id])
        .then(async () => {
          jsonReply(context, { success: true });
        });
    }
  });
};
