const { db } = require("../util");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  let query = "SELECT * FROM tags";
  const values = [];
  if (req.query.tag) {
    query += " WHERE tag LIKE ?";
    values.push(`${req.query.tag}%`);
  }
  const qRes = await connection.query(query, values);
  const tags = qRes.map((row) => row.tag);
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: { tags },
  };
};
