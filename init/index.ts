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
    ...getLinks(req, ["drafts", "entries", "filters", "entry"]),
    ...getContextLinks(req),
  ];
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
