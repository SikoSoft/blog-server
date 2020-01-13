const { db, baseUrl } = require("../util");

module.exports = async function(context, req) {
  await db.getConnection().then(async connection => {
    await connection
      .query("SELECT * FROM entries ORDER BY created DESC")
      .then(async entries => {
        let tagQuery = `SELECT * FROM entries_tags WHERE ${[...entries]
          .fill("entry_id = ?")
          .join(" || ")}`;
        await connection
          .query(
            tagQuery,
            entries.map(entry => entry.id)
          )
          .then(tagsRes => {
            context.res = {
              status: 200,
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                entries: entries.map(entry => {
                  const endpoint = `${baseUrl(req.originalUrl)}/entry/${
                    entry.id
                  }`;
                  return {
                    ...entry,
                    tags: tagsRes
                      .filter(tagRow => tagRow.entry_id === entry.id)
                      .map(tagRow => tagRow.tag),
                    api: {
                      save: { href: endpoint, method: "PUT" },
                      delete: { href: endpoint, method: "DELETE" }
                    }
                  };
                })
              })
            };
          });
      });
  });
};
