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
  if (!(await hasLinkAccess(req, req.method, "tags"))) {
    crudViolation(context);
    return;
  }
  const connection = await getConnection();
  let qRes;
  if (req.query.tag) {
    qRes = await connection
      .select("*")
      .from("tags")
      .where("tag", "like", req.query.tag);
  } else {
    qRes = await connection.select("*").from("tags");
  }
  const tags = qRes.map((row) => row.tag);
  jsonReply(context, {
    tags,
    links: await getLinks(req, "tagRole", req.query.tag),
  });
};

export default httpTrigger;
