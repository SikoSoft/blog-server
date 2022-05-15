import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection, jsonReply } from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const connection = await getConnection();
  const result = await connection
    .select("*")
    .from("entries")
    .where("public", 1)
    .andWhere("title", "like", `%${req.query.title}%`);
  jsonReply(context, result);
};

export default httpTrigger;
