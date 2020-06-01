const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    await connection
      .query("SELECT id, title FROM entries WHERE public = 1 && title LIKE ?", [
        `%${req.query.title}%`,
      ])
      .then(async (result) => {
        jsonReply(context, result);
      });
  });
};
