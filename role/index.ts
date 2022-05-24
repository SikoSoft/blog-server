import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { roles } from "blog-spec";
import { parse } from "query-string";
import { getConnection, jsonReply, flushState, getLinks } from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    const res = await connection("roles").insert({ name: body.name });
    const role = await connection
      .select("*")
      .from("roles")
      .where("id", res)
      .first();
    flushState("roles");
    jsonReply(context, {
      role: { ...role, links: await getLinks(req, "role", role.id) },
    });
  } else if (req.method === "PUT") {
    await connection("roles")
      .update("name", body.name)
      .where("id", context.bindingData.id);
    const role = await connection
      .select("*")
      .from("roles")
      .where("id", context.bindingData.id)
      .first();
    flushState("roles");
    jsonReply(context, {
      role: { ...role, links: await getLinks(req, "role", role.id) },
    });
  } else if (req.method === "DELETE") {
    await connection("roles").where("id", context.bindingData.id).delete();
    flushState("roles");
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
