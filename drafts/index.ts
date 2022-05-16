import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import entriesEndpoint from "../entries";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<any> => {
  return entriesEndpoint(context, req, true);
};

export default httpTrigger;
