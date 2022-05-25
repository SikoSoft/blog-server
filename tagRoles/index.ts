import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  crudViolation,
  getConnection,
  getLinks,
  hasLinkAccess,
  jsonReply,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "tagRoles"))) {
    crudViolation(context);
    return;
  }
  const connection = await getConnection();
  const rights = await connection
    .select("*")
    .from("tags_rights")
    .orderBy(["tag", "role"]);
  jsonReply(context, {
    tagRoles: await Promise.all(
      rights.map(async (right) => ({
        ...right,
        links: await getLinks(req, "tagRole", [right.tag, right.role]),
      }))
    ),
    links: await getLinks(req, "tags"),
  });
};

export default httpTrigger;
