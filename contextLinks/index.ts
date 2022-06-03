import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { hasLinkAccess, getContextLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

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
