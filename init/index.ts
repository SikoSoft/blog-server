import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import {
  getConnection,
  getLinks,
  getContextLinks,
  getSettings,
  getSessionRole,
  getSessionRights,
  jsonReply,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const rights = await getSessionRights(req.headers["sess-token"]);
  const links = [
    ...getLinks(req, ["drafts", "entries", "filters"]),
    ...getContextLinks(req),
  ];
  /*
  const links = {};
  [
    ["getEntry", "entry/{id}", "GET"],
    ["getDraft", "entry/{id}", "GET"],
    ["getEntries", "entries", "GET"],
    ["getEntriesByTag", "tag/{tag}", "GET"],
    ["getTags", "tags", "GET"],
    rights.includes("create_entry") ? ["newEntry", "entry", "POST"] : [],
    ["uploadImage", "uploadImage/{type}", "POST"],
    ["useToken", "useToken", "POST"],
    ["saveSetting", "saveSetting", "POST"],
    ["getDrafts", "drafts", "GET"],
    ["getFilters", "getFilters", "GET"],
    ["getEntriesByFilter", "filter/{filter}", "GET"],
    ["getEntriesByTag", "tag/{tag}", "GET"],
    ["findEntry", "find", "GET"],
    rights.includes("manage_filters") ? ["newFilter", "filter", "POST"] : [],
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
    ["getTokens", "tokens", "GET"],
    rights.includes("manage_images")
      ? ["getImageSizes", "imageSizes", "GET"]
      : [],
    rights.includes("manage_images")
      ? ["addImageSize", "imageSize", "POST"]
      : [],
    rights.includes("manage_images")
      ? ["updateImageSize", "imageSize", "PUT"]
      : [],
    rights.includes("manage_images")
      ? ["deleteImageSize", "imageSize", "DELETE"]
      : [],
  ].forEach((endpoint) => {
    links[endpoint[0]] = getEndpoint(
      {
        href: `${endpoint[1]}`,
        method: endpoint[2],
      },
      req
    );
  });
  */
  const settings = await getSettings();

  const sessionRole = await getSessionRole(req.headers["sess-token"]);
  const user = {
    role: sessionRole ? sessionRole : settings.role_guest,
    rights,
  };
  const connection = await getConnection();
  const qRes = await connection.select("*").from("roles");
  const roles = qRes.map((row) => ({
    id: row.id,
    name: row.name,
  }));
  jsonReply(context, {
    user,
    roles,
    settings,
    links,
  });
};

export default httpTrigger;
