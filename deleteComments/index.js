const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const { ids } = body;
  const connection = await db.getConnection();
  const qRes = await connection.query(
    `DELETE FROM comments WHERE ${[...ids].fill("id = ?").join(" || ")}`,
    ids
  );
  jsonReply(context, { numDeleted: qRes.affectedRows });
};
