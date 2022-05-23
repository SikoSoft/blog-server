import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const { getConnection, jsonReply, getLinks } = require("../util.js");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const connection = await getConnection();
  let tokens = await connection.select("*").from("tokens").orderBy("code");
  if (tokens.length) {
    tokens = tokens.map((token) => ({
      ...token,
      links: getLinks(req, "token", token.code),
    }));
  }
  jsonReply(context, {
    links: getLinks(req, "token"),
    tokens,
  });
};

export default httpTrigger;
