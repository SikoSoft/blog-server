import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { jsonReply, getConnection, getEndpoint } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const connection = await getConnection();
  const imageSizes = await connection.select("*").from("image_sizes");
  console.log("imageSizes", imageSizes);
  jsonReply(context, {
    imageSizes: imageSizes.map((imageSize) => ({
      ...imageSize,
      links: {
        update: getEndpoint(
          { href: `imageSize/${imageSize.width}`, method: "PUT" },
          req
        ),
        delete: getEndpoint(
          { href: `imageSize/${imageSize.width}`, method: "DELETE" },
          req
        ),
      },
    })),
  });
};

export default httpTrigger;
