const {
  db,
  baseUrl,
  getEndpoint,
  getSettings,
  getSessionRole,
  getSessionRights,
  jsonReply,
} = require("../util");

module.exports = async function (context, req) {
  const apiHost = baseUrl(req);
  const api = {};
  [
    ["getEntry", "entry/{id}", "GET"],
    ["getDraft", "entry/{id}", "GET"],
    ["getEntries", "entries", "GET"],
    ["getEntriesByTag", "tag/{tag}", "GET"],
    ["getTags", "tags", "GET"],
    ["newEntry", "entry", "POST"],
    ["uploadImage", "uploadImage/{type}", "POST"],
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
    ["saveFilterOrder", "saveFilterOrder", "PUT"],
    ["getFilterRules", "filterRules", "GET"],
    ["addFilterRule", "filterRule/{filterId}", "POST"],
    ["deleteFilterRule", "filterRule/{filterId}", "DELETE"],
    ["saveFilterRule", "filterRule/{filterId}", "PUT"],
    ["getRoleRights", "roleRights", "GET"],
    ["addRoleRight", "roleRight/{role}/{action}", "POST"],
    ["addTagRole", "tagRole/{tag}/{role}", "POST"],
    ["deleteTagRole", "tagRole/{tag}/{role}", "DELETE"],
    ["getTagRoles", "tagRoles", "GET"],
    ["addRole", "role", "POST"],
    ["updateRole", "role/{role}", "PUT"],
    ["deleteRole", "role/{role}", "DELETE"],
  ].forEach((endpoint) => {
    api[endpoint[0]] = getEndpoint(
      {
        href: `${apiHost}/${endpoint[1]}`,
        method: endpoint[2],
      },
      req
    );
  });
  context.log("process.env", process.env);
  const settings = await getSettings();
  const rights = await getSessionRights(req.headers["sess-token"]);
  const sessionRole = await getSessionRole(req.headers["sess-token"]);
  const user = {
    role: sessionRole ? sessionRole : settings.role_guest,
    rights,
  };
  const connection = await db.getConnection();
  const qRes = await connection.query("SELECT * FROM roles");
  const roles = qRes.map((row) => ({
    id: row.id,
    name: row.name,
  }));
  jsonReply(context, {
    user,
    roles,
    settings,
    api,
  });
};
