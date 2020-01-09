const { db, baseUrl } = require("../util");

module.exports = async function(context, req) {
  const apiHost = baseUrl(req.originalUrl);
  const user = {
    role: 1
  };
  const api = {
    getEntries: `${apiHost}/entries`,
    getEntriesByTag: `${apiHost}/tags/{tag}`,
    getTags: `${apiHost}/tags`,
    saveEntry: `${apiHost}/entry`
  };
  await db.getConnection().then(async dbCon => {
    console.log("got connection");
    await dbCon.query("SELECT * FROM roles").then(async qRes => {
      const roles = qRes.map(row => ({
        id: row.id,
        name: row.name,
        rights: ["c", "r", "u", "d"].filter(right => row[right] === 1)
      }));
      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          roles,
          api
        })
      };
    });
  });
};
