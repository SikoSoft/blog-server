import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLinks } from "../util";

const { getConnection, jsonReply } = require("../util.js");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  const filters = await connection.select("*").from("filters").orderBy("order");
  const filtersRules = await connection.select("*").from("filters_rules");
  jsonReply(context, {
    filters: await Promise.all(
      filters.map(async (filter) => ({
        ...filter,
        rules: await Promise.all(
          filtersRules
            .filter((rule) => rule.filter_id === filter.id)
            .map(async (rule) => ({
              ...rule,
              links: await getLinks(req, "filterRule", rule.id),
            }))
        ),
        links: [
          ...(await getLinks(req, "filter", filter.id)),
          ...(await getLinks(req, "filterRule")),
          ...(await getLinks(req, "uploadImage", "filter")),
        ],
      }))
    ),
    links: await getLinks(req, "filter"),
  });
};

export default httpTrigger;
