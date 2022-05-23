import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLinks, getSettings, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const settings = Object.entries(await getSettings()).map(([id, value]) => ({
    id,
    value,
    links: [...getLinks(req, "setting", id), ...getLinks(req, "banners")],
  }));
  jsonReply(context, { settings });
};

export default httpTrigger;
