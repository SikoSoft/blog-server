import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const connection = await getConnection();
  let qRes;
  if (req.query.tag) {
    qRes = await connection
      .select("*")
      .from("tags")
      .where("tag", "like", req.query.tag);
  } else {
    qRes = await connection.select("*").from("tags");
  }
  const tags = qRes.map((row) => row.tag);
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: { tags },
  };
};

export default httpTrigger;