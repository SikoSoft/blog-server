import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  crudViolation,
  getContextLinks,
  hasLinkAccess,
  jsonReply,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "contextLinks"))) {
    crudViolation(context);
    return;
  }
  const links = await getContextLinks(req);
  jsonReply(context, { links });
};

export default httpTrigger;
