import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import {
  crudViolation,
  hasLinkAccess,
  getConnection,
  jsonReply,
  getLinks,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "blockContent"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await getConnection();
  let blockContent;
  switch (req.method) {
    case "POST":
      const res = await connection("blocks_content").insert({
        block_id: body.block_id,
        type: body.type,
        content: body.content,
      });
      blockContent = await connection
        .select("*")
        .from("blocks_content")
        .where({ id: res[0] })
        .first();
      jsonReply(context, {
        blockContent: {
          ...blockContent,
          links: await getLinks(req, "blockContent", blockContent.id),
        },
      });
      break;
    case "PUT":
      await connection("blocks_content")
        .update({
          block_id: body.block_id,
          type: body.type,
          content: body.content,
        })
        .where({ id: context.bindingData.id });
      blockContent = await connection
        .select("*")
        .from("blocks_content")
        .where({ id: context.bindingData.id })
        .first();
      jsonReply(context, {
        blockContent: {
          ...blockContent,
          links: await getLinks(req, "blockContent", blockContent.id),
        },
      });
      break;
    case "DELETE":
      const result = await connection("blocks_content")
        .where({ id: context.bindingData.id })
        .delete();
      jsonReply(context, { result });
      break;
  }
};

export default httpTrigger;
