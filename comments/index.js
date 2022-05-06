const { db, getSessionRights, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const rights = await getSessionRights(req.headers["sess-token"]);
  const canViewUnpublished = rights.includes("view_unpublished_comment");
  const connection = await db.getConnection();
  const comments = await connection.query(
    "SELECT * FROM comments WHERE entry_id = ? ORDER BY time DESC",
    [context.bindingData.id]
  );
  jsonReply(context, {
    comments: comments.filter(
      (comment) => comment.public === 1 || canViewUnpublished
    ),
  });
};
