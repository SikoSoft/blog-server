const { db, jsonReply, getEndpoint } = require("../util.js");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  const rights = await connection.query(
    "SELECT * FROM roles_rights ORDER by `role`, `action`"
  );
  jsonReply(
    context,
    rights.map((right) => ({
      ...right,
      links: {
        delete: getEndpoint(
          {
            href: `roleRight/${right.role}/${right.action}`,
            method: "DELETE",
          },
          req
        ),
      },
    }))
  );
};
