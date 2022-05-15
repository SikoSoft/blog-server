import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const { getConnection, jsonReply, getEndpoint } = require("../util.js");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const connection = await getConnection();
  let tokens = await connection.select("*").from("tokens").orderBy("code");
  if (tokens.length) {
    tokens = tokens.map((token) => ({
      ...token,
      links: {
        update: getEndpoint(
          { href: `token/${token.code}`, method: "PUT" },
          req
        ),
        delete: getEndpoint(
          { href: `token/${token.code}`, method: "DELETE" },
          req
        ),
      },
    }));
  }
  jsonReply(context, {
    links: {
      create: getEndpoint({ href: "token", method: "POST" }, req),
    },
    tokens,
  });
};

export default httpTrigger;
