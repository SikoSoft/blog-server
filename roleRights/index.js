const { db, jsonReply, baseUrl, getEndpoint } = require("../util.js");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  const rights = await connection.query(
    "SELECT * FROM roles_rights ORDER by `role`, `action`"
  );
  const apiHost = baseUrl(req);
  jsonReply(
    context,
    rights.map((right) => ({
      ...right,
      api: {
        delete: getEndpoint(
          {
            href: `${apiHost}/roleRight/${right.role}/${right.action}`,
            method: "DELETE",
          },
          req
        ),
      },
    }))
  );
};
