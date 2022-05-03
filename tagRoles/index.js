const { db, jsonReply } = require("../util.js");

module.exports = async function (context) {
  const connection = await db.getConnection();
  const rights = await connection.query(
    "SELECT * FROM tags_rights ORDER by `tag`, `role`"
  );
  jsonReply(context, rights);
};
