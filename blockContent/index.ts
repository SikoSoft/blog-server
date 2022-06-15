import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

const getBodyData = (body: Record<string, any>): Record<string, any> => {
  return {
    ...(body.block_id ? { block_id: body.block_id } : {}),
    ...(body.type ? { type: body.type } : {}),
    ...(body.content ? { content: body.content } : {}),
    ...(body.order ? { order: body.order } : {}),
  };
};

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
      const res = await connection("blocks_content").insert(getBodyData(body));
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
        .update(getBodyData(body))
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
