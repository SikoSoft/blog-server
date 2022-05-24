import { Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection, jsonReply, flushState, getLinks } from "../util";

module.exports = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    await connection("tags_rights").insert({
      tag: context.bindingData.tag,
      role: body.role,
    });
    flushState();
    const tagRole = await connection
      .select("*")
      .from("tags_rights")
      .where({ tag: context.bindingData.tag, role: body.role })
      .first();
    jsonReply(context, {
      success: true,
      tagRole: {
        ...tagRole,
        links: await getLinks(req, "tagRole", [
          context.bindingData.tag,
          body.role,
        ]),
      },
    });
  } else if (req.method === "DELETE") {
    await connection("tags_rights")
      .where({
        tag: context.bindingData.tag,
        role: context.bindingData.role,
      })
      .delete();
    flushState();
    jsonReply(context, { success: true });
  }
};
