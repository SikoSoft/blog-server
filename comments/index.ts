import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { getConnection, getSessionRights, jsonReply, getLinks } from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const rights = await getSessionRights(req.headers["sess-token"]);
  const canViewUnpublished = rights.includes("view_unpublished_comment");
  const connection = await getConnection();
  const comments = await connection
    .select("*")
    .from("comments")
    .where("entry_id", context.bindingData.id)
    .orderBy("time", "desc");
  jsonReply(context, {
    comments: comments
      .filter((comment) => comment.public === 1 || canViewUnpublished)
      .map((comment) => ({
        ...comment,
        links: getLinks(req, "comment", comment.id),
      })),
  });
};

export default httpTrigger;
