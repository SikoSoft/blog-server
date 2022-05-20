import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection, getLinks, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  const rights = await connection
    .select("*")
    .from("tags_rights")
    .orderBy(["tag", "role"]);
  jsonReply(context, {
    tagRoles: rights.map((right) => ({
      ...right,
      links: getLinks(req, "tagRole", [right.tag, right.role]),
    })),
    links: getLinks(req, "tags"),
  });
};

export default httpTrigger;
