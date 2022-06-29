import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("image", req);
  context.res = {
    status: 302,
    headers: {
      Location: `${process.env.AZURE_STORAGE_URL}${req.query.file}`,
    },
  };
};

export default httpTrigger;
