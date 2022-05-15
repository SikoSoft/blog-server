import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { getConnection, jsonReply, getEndpoint } from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  const rights = await connection
    .select("*")
    .from("roles_rights")
    .orderBy(["role", "action"]);
  jsonReply(
    context,
    rights.map((right) => ({
      ...right,
      links: {
        delete: getEndpoint(
          {
            href: `roleRight/${right.role}/${right.action}`,
            method: "DELETE",
          },
          req
        ),
      },
    }))
  );
};

export default httpTrigger;
