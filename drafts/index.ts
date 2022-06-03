import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import entriesEndpoint from "../entries";
import { hasLinkAccess } from "../util/links";
import { crudViolation } from "../util/reply";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<any> => {
  if (!(await hasLinkAccess(req, req.method, "drafts"))) {
    crudViolation(context);
    return;
  }
  return entriesEndpoint(context, req, true);
};

export default httpTrigger;
