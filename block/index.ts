import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { BlogBlock } from "../interfaces/BlogBlock";
import { getConnection } from "../util/database";
import { getLinks, hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import spec = require("blog-spec");

export const getBlock = async (
  req: HttpRequest,
  id: number
): Promise<BlogBlock | boolean> => {
  try {
    const connection = await getConnection();
    const block = await connection
      .select("*")
      .from("blocks")
      .where("id", id)
      .first();
    const content = await connection
      .select("*")
      .from("blocks_content")
      .where("block_id", id)
      .orderBy("order");
    const context = await connection
      .select("*")
      .from("blocks_context")
      .where("block_id", id);
    const contentIdsWithProps = content
      .filter(
        (content) => content.type === spec.blockTypes.BLOCK_TYPE_COMPONENT
      )
      .map((content) => content.id);
    let componentProps = [];
    if (contentIdsWithProps.length) {
      componentProps = await connection
        .select("*")
        .from("blocks_content_components_props")
        .whereIn("content_id", contentIdsWithProps);
    }
    if (block) {
      return {
        ...block,
        content: await Promise.all(
          content.map(async (content) => ({
            ...content,
            ...(content.type === spec.blockTypes.BLOCK_TYPE_COMPONENT &&
            componentProps.filter((prop) => prop.content_id === content.id)
              .length
              ? {
                  props: componentProps.filter(
                    (prop) => prop.content_id === content.id
                  ),
                }
              : { props: [] }),
            links: await getLinks(req, "blockContent", content.id),
          }))
        ),
        context: await Promise.all(
          context.map(async (context) => ({
            ...context,
            links: await getLinks(req, "blockContent", context.id),
          }))
        ),
        links: await getLinks(req, "block", id),
      };
    }
  } catch (error) {
    console.error(error);
  }
  return false;
};

export const run: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "block"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await getConnection();
  switch (req.method) {
    case "GET":
      jsonReply(context, {
        block: await getBlock(req, context.bindingData.id),
      });
      break;
    case "POST":
      const res = await connection("blocks").insert({ name: body.name });
      jsonReply(context, {
        block: await getBlock(req, res[0]),
      });
      break;
    case "PUT":
      await connection("blocks")
        .update({ name: body.name })
        .where("id", context.bindingData.id);
      jsonReply(context, {
        block: await getBlock(req, context.bindingData.id),
      });
      break;
    case "DELETE":
      const result = await connection("blocks")
        .where("id", context.bindingData.id)
        .delete();
      await connection("blocks_context")
        .where("block_id", context.bindingData.id)
        .delete();
      await connection("blocks_content")
        .where("block_id", context.bindingData.id)
        .delete();
      jsonReply(context, { result });
      break;
  }
};

export default run;
