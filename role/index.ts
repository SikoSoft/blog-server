import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply, flushState } from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    const res = await connection("roles").insert({ name: body.name });
    flushState("roles");
    jsonReply(context, { id: res[0], success: true });
  } else if (req.method === "PUT") {
    await connection("roles")
      .update("name", body.name)
      .where("id", context.bindingData.id);
    flushState("roles");
    jsonReply(context, { success: true });
  } else if (req.method === "DELETE") {
    await connection("roles").where("id", context.bindingData.id).delete();
    flushState("roles");
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
