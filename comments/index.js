const { db } = require("../util");

module.exports = async function(context, req) {
  await db.getConnection().then(async dbCon => {
    await dbCon
      .query("SELECT * FROM comments WHERE entry_id = ? ORDER BY time DESC", [
        context.bindingData.id
      ])
      .then(comments => {
        context.res = {
          status: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            comments
          })
        };
      });
  });
};
