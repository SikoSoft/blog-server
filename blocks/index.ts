import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getConnection,
  jsonReply,
  getLinks,
  crudViolation,
  hasLinkAccess,
} from "../util";

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
  jsonReply(context, {
    blocks: await Promise.all(
      blocks.map(async (block) => ({
        ...block,
        content: await Promise.all(
          blocksContent
            .filter((content) => content.block_id === block.id)
            .map(async (content) => ({
              ...content,
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
    links: await getLinks(req, "block"),
  });
};

export default httpTrigger;
