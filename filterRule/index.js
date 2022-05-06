const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await db.getConnection();
  if (req.method === "POST") {
    const res = await connection.query(
      "INSERT INTO filters_rules (filter_id, type, value, operator) VALUES(?, ?, ?, ?)",
      [context.bindingData.entryId, body.type, body.value, body.operator]
    );
    jsonReply(context, { id: res.insertId, success: true });
  } else if (req.method === "PUT") {
    await connection.query(
      "REPLACE INTO filters_rules (filter_id, type, value, operator) VALUES(?, ?, ?, ?)",
      [context.bindingData.entryId, body.type, body.value, body.operator]
    );
    jsonReply(context, { success: true });
  } else if (req.method === "DELETE") {
    await connection.query("DELETE FROM filters_rules WHERE id = ?", [body.id]);
    jsonReply(context, { success: true });
  }
};
