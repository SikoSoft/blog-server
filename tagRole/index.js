const { db, jsonReply, flushState } = require("../util");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  if (req.method === "POST") {
    await connection.query("INSERT INTO tags_rights (tag, role) VALUES(?, ?)", [
      context.bindingData.tag,
      context.bindingData.role,
    ]);
    flushState();
    jsonReply(context, { success: true });
  } else if (req.method === "DELETE") {
    await connection.query(
      "DELETE FROM tags_rights WHERE tag = ? AND role = ?",
      [context.bindingData.tag, context.bindingData.role]
    );
    flushState();
    jsonReply(context, { success: true });
  }
};
