import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { getConnection, jsonReply, getLinks } from "../util.js";

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
      links: getLinks(req, "roleRight", [right.role, right.action]),
    }))
  );
};

export default httpTrigger;
