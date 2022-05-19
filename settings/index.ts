import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLinks, getSettings, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  console.log(await getSettings());
  const settings = Object.entries(await getSettings()).map(([id, value]) => ({
    id,
    value,
    links: getLinks(req, "setting", id),
  }));
  jsonReply(context, { settings });
};

export default httpTrigger;
