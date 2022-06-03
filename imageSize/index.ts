import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  body.width = body.width ? parseInt(body.width) : 0;
  body.height = body.height ? parseInt(body.height) : 0;
  const connection = await getConnection();
  switch (req.method) {
    case "PUT":
      await connection("image_sizes")
        .update({
          width: body.width,
          height: body.height,
        })
        .where("width", context.bindingData.width)
        .onConflict()
        .merge();
      jsonReply(context, {});
      break;
    case "POST":
      await connection("image_sizes")
        .insert({ width: body.width, height: body.height })
        .onConflict()
        .merge();
      jsonReply(context, {});
      break;
    case "DELETE":
      await connection("image_sizes")
        .delete()
        .where("width", context.bindingData.width);
      break;
  }
};

export default httpTrigger;
