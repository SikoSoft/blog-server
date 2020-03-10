const { db, baseUrl, getEndpoint } = require("../util");

module.exports = async function(context, req) {
  const apiHost = baseUrl(req.originalUrl);
  const user = {
    role: 1
  };
  const api = {
    getEntries: getEndpoint(
      {
        href: `${apiHost}/entries`,
        method: "GET"
      },
      req
    ),
    getEntriesByTag: getEndpoint(
      {
        href: `${apiHost}/tags/{tag}`,
        method: "GET"
      },
      req
    ),
    getTags: getEndpoint(
      {
        href: `${apiHost}/tags`,
        method: "GET"
      },
      req
    ),
    newEntry: getEndpoint(
      {
        href: `${apiHost}/entry`,
        method: "POST"
      },
      req
    ),
    uploadImage: getEndpoint(
      {
        href: `${apiHost}/uploadImage`,
        method: "POST"
      },
      req
    ),
    useToken: getEndpoint(
      {
        href: `${apiHost}/useToken`,
        method: "POST"
      },
      req
    ),
    publishComments: getEndpoint(
      {
        href: `${apiHost}/publishComments`,
        method: "POST"
      },
      req
    ),
    deleteComments: getEndpoint(
      {
        href: `${apiHost}/deleteComments`,
        method: "POST"
      },
      req
    ),
    saveSetting: getEndpoint(
      {
        href: `${apiHost}/saveSetting`,
        method: "POST"
      },
      req
    )
  };
  await db.getConnection().then(async dbCon => {
    await dbCon.query("SELECT * FROM roles").then(async qRes => {
      const roles = qRes.map(row => ({
        id: row.id,
        name: row.name,
        rights: ["c", "r", "u", "d"].filter(right => row[right] === 1)
      }));
      await dbCon.query("SELECT * FROM settings").then(async ([settings]) => {
        context.res = {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user,
            roles,
            settings,
            api
          })
        };
      });
    });
  });
};
