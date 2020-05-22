const {
  db,
  baseUrl,
  getEndpoint,
  getSettings,
  getSessionRole,
  getSessionRights,
} = require("../util");

module.exports = async function (context, req) {
  const apiHost = baseUrl(req.originalUrl);
  const api = {
    getEntry: getEndpoint(
      {
        href: `${apiHost}/entry/{id}`,
        method: "GET",
      },
      req
    ),
    getDraft: getEndpoint(
      {
        href: `${apiHost}/draft/{id}`,
        method: "GET",
      },
      req
    ),
    getEntries: getEndpoint(
      {
        href: `${apiHost}/entries`,
        method: "GET",
      },
      req
    ),
    getEntriesByTag: getEndpoint(
      {
        href: `${apiHost}/tags/{tag}`,
        method: "GET",
      },
      req
    ),
    getTags: getEndpoint(
      {
        href: `${apiHost}/tags`,
        method: "GET",
      },
      req
    ),
    newEntry: getEndpoint(
      {
        href: `${apiHost}/entry`,
        method: "POST",
      },
      req
    ),
    uploadImage: getEndpoint(
      {
        href: `${apiHost}/uploadImage`,
        method: "POST",
      },
      req
    ),
    useToken: getEndpoint(
      {
        href: `${apiHost}/useToken`,
        method: "POST",
      },
      req
    ),
    publishComments: getEndpoint(
      {
        href: `${apiHost}/publishComments`,
        method: "POST",
      },
      req
    ),
    deleteComments: getEndpoint(
      {
        href: `${apiHost}/deleteComments`,
        method: "POST",
      },
      req
    ),
    saveSetting: getEndpoint(
      {
        href: `${apiHost}/saveSetting`,
        method: "POST",
      },
      req
    ),
    getDrafts: getEndpoint(
      {
        href: `${apiHost}/drafts`,
        method: "POST",
      },
      req
    ),
    getFilters: getEndpoint(
      {
        href: `${apiHost}/getFilters`,
        method: "GET",
      },
      req
    ),
    getEntriesByFilter: getEndpoint(
      {
        href: `${apiHost}/filter/{filter}`,
        method: "GET",
      },
      req
    ),
    getEntriesByTag: getEndpoint(
      {
        href: `${apiHost}/tag/{tag}`,
        method: "GET",
      },
      req
    ),
  };

  await getSettings().then(async (settings) => {
    await getSessionRights(req.headers["sess-token"]).then(async (rights) => {
      await getSessionRole(req.headers["sess-token"]).then(
        async (sessionRole) => {
          const user = {
            role: sessionRole ? sessionRole : settings.role_guest,
            rights,
          };
          await db.getConnection().then(async (dbCon) => {
            await dbCon.query("SELECT * FROM roles").then(async (qRes) => {
              const roles = qRes.map((row) => ({
                id: row.id,
                name: row.name,
                rights: ["c", "r", "u", "d"].filter(
                  (right) => row[right] === 1
                ),
              }));
              context.res = {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user,
                  roles,
                  settings,
                  api,
                }),
              };
            });
          });
        }
      );
    });
  });
};
