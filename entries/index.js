const { db } = require("../util");

module.exports = async function(context, req) {
  await db.getConnection().then(async connection => {
    await connection
      .query("SELECT * FROM entries ORDER BY created DESC")
      .then(async entries => {
        context.res = {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ entries })
        };
      });
  });
};
