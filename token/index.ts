import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { getLinks, hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

const getToken = async (connection, req: HttpRequest, code: string) => {
  const [token] = await connection
    .select("*")
    .from("tokens")
    .where("code", code);
  token.links = await getLinks(req, "token", code);
  return token;
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "token"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    await connection("tokens").insert({
      code: body.code,
      one_time: body.one_time,
      role: body.role,
    });
    jsonReply(context, {
      token: await getToken(connection, req, body.code),
    });
  } else if (req.method === "PUT") {
    await connection("tokens")
      .update({ code: body.code, one_time: body.one_time, role: body.role })
      .where("code", context.bindingData.code);
    jsonReply(context, {
      token: await getToken(connection, req, body.code),
    });
  } else if (req.method === "DELETE") {
    const result = await connection("tokens")
      .where("code", context.bindingData.code)
      .delete();
    jsonReply(context, { success: result > 0 });
  }
};

export default httpTrigger;
