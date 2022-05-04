const { db, jsonReply, flushState, baseUrl, getEndpoint } = require("../util");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  if (req.method === "POST") {
    await connection.query(
      "INSERT INTO roles_rights (role, action) VALUES(?, ?)",
      [context.bindingData.role, context.bindingData.action]
    );
    flushState("rights");
    const apiHost = baseUrl(req);
    const right = {
      role: context.bindingData.role,
      action: context.bindingData.action,
      links: {
        delete: getEndpoint(
          {
            href: `${apiHost}/roleRight/${context.bindingData.role}/${context.bindingData.action}`,
            method: "DELETE",
          },
          req
        ),
      },
    };
    jsonReply(context, { right, success: true });
  } else if (req.method === "DELETE") {
    await connection.query(
      "DELETE FROM roles_rights WHERE role = ? AND action = ?",
      [context.bindingData.role, context.bindingData.action]
    );
    flushState("rights");
    jsonReply(context, { success: true });
  }
};
