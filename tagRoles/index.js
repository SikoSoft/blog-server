const { db, jsonReply } = require("../util.js");

module.exports = async function (context) {
    await db.getConnection().then(async (connection) => {
        await connection
          .query("SELECT * FROM tags_rights ORDER by `tag`, `role`")
          .then(async (rights) => {
            jsonReply(context, rights);
          });
      });
}