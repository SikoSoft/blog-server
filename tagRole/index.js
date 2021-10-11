const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
    await db.getConnection().then(async (connection) => {
        if (req.method === "POST") {
          await connection
            .query(
              "INSERT INTO tags_rights (tag, role) VALUES(?, ?)",
              [context.bindingData.tag, context.bindingData.role]
            )
            .then(async () => {
              jsonReply(context, { success: true });
            });
        } else if (req.method === "DELETE") {
          await connection
            .query("DELETE FROM tags_rights WHERE tag = ? AND role = ?", [context.bindingData.tag, context.bindingData.role])
            .then(async () => {
              jsonReply(context, { success: true });
            });
        }
      });
}