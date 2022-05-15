import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply } from "../util";

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
    context.res = {
      status: 400,
    };
  }
};

export default httpTrigger;
