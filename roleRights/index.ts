import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlogRole } from "../interfaces/BlogRole.js";

import { getConnection, jsonReply, getLinks, getRoles } from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  const rights = await connection
    .select("*")
    .from("roles_rights")
    .orderBy(["role", "action"]);
  const roles = await getRoles();
  jsonReply(context, {
    roleRights: rights.map((right) => ({
      ...right,
      links: getLinks(req, "roleRight", [right.role, right.action]),
    })),
    links: roles
      .map((right: BlogRole) => getLinks(req, "roleRight", right.id, right.id))
      .reduce((prev, cur) => [...prev, ...cur], []),
  });
};

export default httpTrigger;
