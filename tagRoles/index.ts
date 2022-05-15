import { AzureFunction, Context } from "@azure/functions";
import { getConnection, jsonReply } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context
): Promise<any> {
  const connection = await getConnection();
  const rights = await connection
    .select("*")
    .from("tags_rights")
    .orderBy(["tag", "role"]);
  jsonReply(context, rights);
};

export default httpTrigger;
