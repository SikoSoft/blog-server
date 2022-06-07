import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import spec = require("blog-spec");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "blocks"))) {
    crudViolation(context);
    return;
  }
  const connection = await getConnection();
  const blocks = await connection.select("*").from("blocks");
  const blocksContent = await connection.select("*").from("blocks_content");
  const blocksContext = await connection.select("*").from("blocks_context");
  const componentProps = await connection
    .select("*")
    .from("blocks_content_components_props");

  jsonReply(context, {
    blocks: await Promise.all(
      blocks.map(async (block) => ({
        ...block,
        content: await Promise.all(
          blocksContent
            .filter((content) => content.block_id === block.id)
            .map(async (content) => ({
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
          blocksContext
            .filter((context) => context.block_id === block.id)
            .map(async (context) => ({
              ...context,
              links: await getLinks(req, "blockContext", context.id),
            }))
        ),
        links: await getLinks(req, "block", block.id),
      }))
    ),
    links: await getLinks(req, ["block", "blockContext", "blockContent"]),
  });
};

export default httpTrigger;
