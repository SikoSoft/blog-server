const { db, getSessionRights } = require("../util");

module.exports = async function(context, req) {
  await getSessionRights(req.headers["sess-token"]).then(async rights => {
    const canViewUnpublished = rights.includes("view_unpublished_comments");
    await db.getConnection().then(async connection => {
      await connection
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
              comments: comments.filter(
                comment => comment.public === 1 || canViewUnpublished
              )
            })
          };
        });
    });
  });
};
