import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getRoles } from "../util/config";
import { getLinks } from "../util/links";
import { jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const roles = await getRoles();
  jsonReply(context, {
    roles: await Promise.all(
      roles.map(async (role) => ({
        ...role,
        links: await getLinks(req, "role", role.id),
      }))
    ),
    links: await getLinks(req, "role"),
  });
};

export default httpTrigger;
