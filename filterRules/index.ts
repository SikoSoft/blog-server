import { AzureFunction, Context } from "@azure/functions";
import { getConnection } from "../util/database";
import { jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context
): Promise<any> {
  const connection = await getConnection();
  const rows = await connection
    .select("*")
    .from("filters_rules")
    .orderBy("filter_id");
  jsonReply(context, { rules: rows });
};

export default httpTrigger;
