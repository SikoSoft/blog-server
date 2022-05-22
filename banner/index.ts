import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply, getLinks } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  switch (req.method) {
    case "POST":
      console.log("body", body);
      const id = await connection("banners").insert(body);
      jsonReply(context, {});
      break;
    case "PUT":
      await connection("banners")
        .update(body)
        .where("id", context.bindingData.id);
      jsonReply(context, {});
      break;
    case "DELETE":
      await connection("banners").delete().where("id", context.bindingData.id);
      jsonReply(context, {});
      break;
  }
};

export default httpTrigger;
