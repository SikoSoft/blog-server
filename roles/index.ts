import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getRoles, jsonReply, getLinks } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const roles = await getRoles();
  jsonReply(context, {
    roles: roles.map((role) => ({
      ...role,
      links: getLinks(req, "role", role.id),
    })),
    links: getLinks(req, "role"),
  });
};

export default httpTrigger;
