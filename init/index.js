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
  const api = {};
  [
    ["getEntry", "entry/{id}", "GET"],
    ["getDraft", "entry/{id}", "GET"],
    ["getEntries", "entries", "GET"],
    ["getEntriesByTag", "tag/{tag}", "GET"],
    ["getTags", "tags", "GET"],
    ["newEntry", "entry", "POST"],
    ["uploadImage", "uploadImage", "POST"],
    ["useToken", "useToken", "POST"],
    ["publishComments", "publishComments", "POST"],
    ["deleteComments", "deleteComments", "POST"],
    ["saveSetting", "saveSetting", "POST"],
    ["getDrafts", "drafts", "GET"],
    ["getFilters", "getFilters", "GET"],
    ["getEntriesByFilter", "filter/{filter}", "GET"],
    ["getEntriesByTag", "tag/{tag}", "GET"],
    ["findEntry", "find", "GET"],
    ["newFilter", "filter", "POST"],
    ["updateFilter", "filter/{filter}", "PUT"],
    ["deleteFilter", "filter/{filter}", "DELETE"],
  ].forEach((endpoint) => {
    api[endpoint[0]] = getEndpoint(
      {
        href: `${apiHost}/${endpoint[1]}`,
        method: endpoint[2],
      },
      req
    );
  });
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
