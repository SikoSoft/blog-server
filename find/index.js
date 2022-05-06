const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  const result = await connection.query(
    "SELECT id, title FROM entries WHERE public = 1 && title LIKE ?",
    [`%${req.query.title}%`]
  );
  jsonReply(context, result);
};
