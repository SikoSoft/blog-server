import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  if (!(await hasLinkAccess(req, req.method, "tokens"))) {
    crudViolation(context);
    return;
  }
  const connection = await getConnection();
  let tokens = await connection.select("*").from("tokens").orderBy("code");
  if (tokens.length) {
    tokens = await Promise.all(
      tokens.map(async (token) => ({
        ...token,
        links: await getLinks(req, "token", token.code),
      }))
    );
  }
  jsonReply(context, {
    links: await getLinks(req, "token"),
    tokens,
  });
};

export default httpTrigger;
