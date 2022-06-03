import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getSettings, getRoles } from "../util/config";
import { getConnection } from "../util/database";
import { getLinks, getContextLinks } from "../util/links";
import { jsonReply } from "../util/reply";
import { getSessionRights, getSessionRole } from "../util/session";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const connection = await getConnection();
  const rights = await getSessionRights(req.headers["sess-token"]);
  const links = [
    ...(await getLinks(req, [
      "contextLinks",
      "drafts",
      "entries",
      "filters",
      "entry",
      "tags",
      "useToken",
    ])),
    ...(await getContextLinks(req)),
  ];
  const settings = await getSettings();
  const sessionRole = await getSessionRole(req.headers["sess-token"]);
  const user = {
    role: sessionRole ? sessionRole : settings.role_guest,
    rights,
  };
  const roles = await getRoles();
  let header = {};
  if (settings.header_banner) {
    header = await connection
      .select("*")
      .from("banners")
      .where("id", settings.header_banner)
      .first();
  }
  jsonReply(context, {
    user,
    roles,
    settings,
    header,
    links,
  });
};

export default httpTrigger;
