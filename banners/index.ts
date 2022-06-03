import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util/database";
import { getLinks } from "../util/links";
import { jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const connection = await getConnection();
  const banners = await connection.select("*").from("banners");
  jsonReply(context, {
    banners: await Promise.all(
      banners.map(async (banner) => ({
        ...banner,
        links: await getLinks(req, "banner", banner.id),
      }))
    ),
    links: await getLinks(req, ["banner", "uploadImage"]),
  });
};

export default httpTrigger;
