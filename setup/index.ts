import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util/database";
import { jsonReply } from "../util/reply";
import { setup } from "../util/setup";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const connection = await getConnection();
  await setup(connection);
  jsonReply(context, { status: "test" });
};

export default httpTrigger;
