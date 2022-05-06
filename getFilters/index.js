const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  const filters = await connection.query(
    "SELECT * FROM filters ORDER by `order`"
  );
  jsonReply(context, filters);
};
