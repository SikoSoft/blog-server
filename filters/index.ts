import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLinks, getFiltersRules, processFilter } from "../util";

const { getConnection, jsonReply } = require("../util.js");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  const filters = await connection.select("*").from("filters").orderBy("order");
  jsonReply(context, {
    filters: await Promise.all(
      filters.map(async (filter) => processFilter(req, filter))
    ),
    links: await getLinks(req, "filter"),
  });
};

export default httpTrigger;
