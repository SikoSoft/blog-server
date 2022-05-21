import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import {
  getRoles,
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
    ...getLinks(req, [
      "contextLinks",
      "drafts",
      "entries",
      "filters",
      "entry",
      "tags",
    ]),
    ...getContextLinks(req),
  ];
  const settings = await getSettings();
  const sessionRole = await getSessionRole(req.headers["sess-token"]);
  const user = {
    role: sessionRole ? sessionRole : settings.role_guest,
    rights,
  };
  const roles = await getRoles();
  jsonReply(context, {
    user,
    roles,
    settings,
    links,
  });
};

export default httpTrigger;
