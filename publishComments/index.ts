import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const { ids } = body;
  const connection = await getConnection();
  const qRes = await connection("comments")
    .update("public", 1)
    .whereIn("id", ids);
  jsonReply(context, { numPublished: qRes });
};

export default httpTrigger;
