const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
    await db.getConnection().then(async (connection) => {
        await connection
          .query("SELECT * FROM roles_rights ORDER by `role`, `action`")
          .then(async (rights) => {
            jsonReply(context, rights);
          });
      });
}