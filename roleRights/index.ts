import { AzureFunction, Context, HttpRequest } from "@azure/functions";

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
      .map((role) => getLinks(req, "roleRight", role.id, role.id))
      .reduce((prev, cur) => [...prev, ...cur], []),
  });
};

export default httpTrigger;
