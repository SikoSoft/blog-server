const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
    await db.getConnection().then(async (connection) => {
        if (req.method === "POST") {
          await connection
            .query(
              "INSERT INTO roles_rights (role, action) VALUES(?, ?)",
              [context.bindingData.role, context.bindingData.action]
            )
            .then(async (res) => {
              jsonReply(context, { id: res.insertId, success: true });
            });
        } else if (req.method === "DELETE") {
          await connection
            .query("DELETE FROM roles_rights WHERE role = ? AND action = ?", [context.bindingData.role, context.bindingData.action])
            .then(async () => {
              jsonReply(context, { success: true });
            });
        }
      });
}