const { db, jsonReply } = require("../util");

module.exports = async function(context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const { ids } = body;
  await db.getConnection().then(async connection => {
    await connection
      .query(
        `DELETE FROM comments WHERE ${[...ids].fill("id = ?").join(" || ")}`,
        ids
      )
      .then(async qRes => {
        jsonReply(context, { numDeleted: qRes.affectedRows });
      });
  });
};
