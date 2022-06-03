import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (body.orderedFilters) {
    await body.orderedFilters.forEach(async (filter, index) => {
      connection("filters").update("order", index).where("id", filter);
    });
    jsonReply(context, { success: true });
  } else {
    jsonReply(context, {}, 400);
  }
};

export default httpTrigger;
