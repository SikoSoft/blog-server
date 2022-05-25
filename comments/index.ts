import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import {
  getConnection,
  getSessionRights,
  jsonReply,
  getLinks,
  crudViolation,
  hasLinkAccess,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  if (!(await hasLinkAccess(req, req.method, "comments"))) {
    crudViolation(context);
    return;
  }
  const rights = await getSessionRights(req.headers["sess-token"]);
  const canViewUnpublished = rights.includes("view_unpublished_comment");
  const connection = await getConnection();
  const comments = await connection
    .select("*")
    .from("comments")
    .where("entry_id", context.bindingData.id)
    .orderBy("time", "desc");
  jsonReply(context, {
    comments: await Promise.all(
      comments
        .filter((comment) => comment.public === 1 || canViewUnpublished)
        .map(async (comment) => ({
          ...comment,
          links: await getLinks(req, "comment", comment.id),
        }))
    ),
  });
};

export default httpTrigger;
