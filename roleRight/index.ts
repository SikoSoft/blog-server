import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { getLinks } from "../util/links";
import { jsonReply } from "../util/reply";
import { flushState } from "../util/state";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    await connection("roles_rights").insert({
      role: context.bindingData.role,
      action: body.action,
    });
    flushState("rights");
    const right = {
      role: context.bindingData.role,
      action: body.action,
      links: await getLinks(req, "roleRight", [
        context.bindingData.role,
        body.action,
      ]),
    };
    jsonReply(context, { right, success: true });
  } else if (req.method === "DELETE") {
    await connection("roles_rights")
      .where({
        role: context.bindingData.role,
        action: context.bindingData.action,
      })
      .delete();
    flushState("rights");
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
