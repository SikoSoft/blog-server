import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getBlock } from "../block";
import { getSettings, getRoles, getImageSizes } from "../util/config";
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
  const settings = {
    ...(await getSettings()),
    imageSizes: await getImageSizes(),
  };
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
  const blocks = [];
  if (settings.sidebar_block) {
    blocks.push(await getBlock(req, settings.sidebar_block));
  }
  if (settings.footer_block) {
    blocks.push(await getBlock(req, settings.footer_block));
  }
  jsonReply(context, {
    user,
    roles,
    settings,
    header,
    links,
    blocks,
  });
};

export default httpTrigger;
