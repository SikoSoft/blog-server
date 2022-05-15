import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const { ids } = body;
  const connection = await getConnection();
  const qRes = await connection("comments").whereIn("id", ids).delete();
  jsonReply(context, { numDeleted: qRes });
};

export default httpTrigger;
