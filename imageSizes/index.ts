import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { jsonReply, getConnection, getLinks } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const connection = await getConnection();
  const imageSizes = await connection.select("*").from("image_sizes");
  jsonReply(context, {
    imageSizes: await Promise.all(
      imageSizes.map(async (imageSize) => ({
        ...imageSize,
        links: await getLinks(req, "imageSize", [imageSize.width]),
      }))
    ),
  });
};

export default httpTrigger;
