const { db, jsonReply } = require("../util");

module.exports = async function(context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  await db.getConnection().then(async connection => {
    await connection
      .query(`UPDATE settings SET ${connection.escapeId(body.id)} = ?`, [
        body.value
      ])
      .then(async qRes => {
        jsonReply(context, qRes.affectedRows);
      });
  });
};
