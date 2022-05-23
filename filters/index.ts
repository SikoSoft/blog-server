import { AzureFunction, Context } from "@azure/functions";

const { getConnection, jsonReply } = require("../util.js");

const httpTrigger: AzureFunction = async function (
  context: Context
): Promise<any> {
  const connection = await getConnection();
  const filters = await connection.select("*").from("filters").orderBy("order");
  jsonReply(context, { filters });
};

export default httpTrigger;
