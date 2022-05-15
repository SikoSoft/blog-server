import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import entriesEndpoint from "../entries";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<any> => {
  req.headers.type = "draft";
  entriesEndpoint(context, req);
};

export default httpTrigger;
