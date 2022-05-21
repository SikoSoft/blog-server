import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getContextLinks, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const links = getContextLinks(req);
  jsonReply(context, { links });
};

export default httpTrigger;
