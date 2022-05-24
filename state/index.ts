import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { flushState, jsonReply, state } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (req.method === "GET") {
    jsonReply(context, { state });
  } else if (req.method === "DELETE") {
    flushState();
    jsonReply(context, { state });
  }
};

export default httpTrigger;
