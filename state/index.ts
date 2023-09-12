import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import { state, flushState } from "../util/state";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "state"))) {
    crudViolation(context);
    return;
  }
  if (req.method === "GET") {
    jsonReply(context, { state });
  } else if (req.method === "DELETE") {
    flushState();
    jsonReply(context, { state });
  }
};

export default httpTrigger;