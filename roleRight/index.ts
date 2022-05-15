import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection, jsonReply, flushState, getEndpoint } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  if (req.method === "POST") {
    await connection("roles_rights").insert({
      role: context.bindingData.role,
      action: context.bindingData.action,
    });
    flushState("rights");
    const right = {
      role: context.bindingData.role,
      action: context.bindingData.action,
      links: {
        delete: getEndpoint(
          {
            href: `roleRight/${context.bindingData.role}/${context.bindingData.action}`,
            method: "DELETE",
          },
          req
        ),
      },
    };
    jsonReply(context, { right, success: true });
  } else if (req.method === "DELETE") {
    await connection("roles_rights")
      .where({
        role: context.bindingData.role,
        action: context.bindingData.action,
      })
      .delete();
    flushState("rights");
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
