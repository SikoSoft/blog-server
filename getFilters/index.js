const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    await connection
      .query("SELECT * FROM filters ORDER by `order`")
      .then(async (filters) => {
        jsonReply(context, filters);
      });
  });
};
