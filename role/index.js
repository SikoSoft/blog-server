const { db, jsonReply, flushState } = require("../util.js");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await db.getConnection();
  if (req.method === "POST") {
    const res = await connection.query("INSERT INTO roles (name) VALUES(?)", [
      body.name,
    ]);

    flushState("roles");
    jsonReply(context, { id: res.insertId, success: true });
  } else if (req.method === "PUT") {
    const res = await connection.query(
      "UPDATE roles SET name = ? WHERE id = ?",
      [body.name, context.bindingData.id]
    );

    flushState("roles");
    jsonReply(context, { success: true });
  } else if (req.method === "DELETE") {
    await connection.query("DELETE FROM roles WHERE id = ?", [
      context.bindingData.id,
    ]);

    flushState("roles");
    jsonReply(context, { success: true });
  }
};
