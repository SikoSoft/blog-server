import { getConnection, jsonReply, flushState } from "../util";

module.exports = async function (context, req) {
  const connection = await getConnection();
  if (req.method === "POST") {
    await connection("tags_rights").insert({
      tag: context.bindingData.tag,
      role: context.bindingData.role,
    });
    flushState();
    jsonReply(context, { success: true });
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
