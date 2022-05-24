import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLinks, getSettings, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const settings = await Promise.all(
    Object.entries(await getSettings()).map(async ([id, value]) => ({
      id,
      value,
      links: [
        ...(await getLinks(req, "setting", id)),
        ...(await getLinks(req, "banners")),
      ],
    }))
  );
  jsonReply(context, { settings });
};

export default httpTrigger;
