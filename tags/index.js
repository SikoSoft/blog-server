const { db } = require("../util");

module.exports = async function(context, req) {
  await db.getConnection().then(async connection => {
    let query = "SELECT * FROM tags";
    const values = [];
    if (req.query.tag) {
      query += " WHERE tag LIKE ?";
      values.push(`${req.query.tag}%`);
    }
    await connection.query(query, values).then(async qRes => {
      console.log("qRes", qRes);
      const tags = qRes.map(row => row.tag);
      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: { tags }
      };
    });
  });
};
