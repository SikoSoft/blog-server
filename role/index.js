const { db, jsonReply, flushState } = require("../util.js");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  await db.getConnection().then(async (connection) => {
    if (req.method === "POST") {
      await connection
        .query("INSERT INTO roles (name) VALUES(?)", [body.name])
        .then(async (res) => {
          flushState("roles");
          jsonReply(context, { id: res.insertId, success: true });
        });
    } else if (req.method === "PUT") {
      await connection
        .query("UPDATE roles SET name = ? WHERE id = ?", [
          body.name,
          context.bindingData.id,
        ])
        .then(async (res) => {
          flushState("roles");
          jsonReply(context, { success: true });
        });
    } else if (req.method === "DELETE") {
      await connection
        .query("DELETE FROM roles WHERE id = ?", [context.bindingData.id])
        .then(async () => {
          flushState("roles");
          jsonReply(context, { success: true });
        });
    }
  });
};
