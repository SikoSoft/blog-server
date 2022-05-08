const { db } = require("../util.js");

module.exports = async function (context, publishTimer) {
  var date = new Date();
  const connection = await db.getConnection();
  const entries = await connection.query(
    "SELECT id, publish_at FROM entries WHERE public = 0 && publish_at != 0"
  );
  entries.forEach((entry) => {
    if (date >= new Date(entry.publish_at * 1000)) {
      context.log(`entry ${entry} is ready to be published`);
      connection.query(
        "UPDATE entries SET public = 1, publish_at = 0, published_at = ? WHERE id = ?",
        [Math.floor(date.getTime() / 1000), entry.id]
      );
    }
  });
};
