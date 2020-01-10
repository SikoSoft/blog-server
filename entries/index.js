const { db, baseUrl } = require("../util");

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
          body: JSON.stringify({
            entries: entries.map(entry => {
              const endpoint = `${baseUrl(req.originalUrl)}/entry/${entry.id}`;
              return {
                ...entry,
                api: {
                  update: { href: endpoint, method: "PUT" },
                  delete: { href: endpoint, method: "DELETE" }
                }
              };
            })
          })
        };
      });
  });
};
