const { db, jsonReply, getEndpoint } = require("../util.js");

module.exports = async function (context, req) {
  const connection = await db.getConnection();
  let tokens = await connection.query("SELECT * FROM tokens ORDER by `code`");
  if (tokens.length) {
    tokens = tokens.map((token) => ({
      ...token,
      links: {
        update: getEndpoint(
          { href: `token/${token.code}`, method: "PUT" },
          req
        ),
        delete: getEndpoint(
          { href: `token/${token.code}`, method: "DELETE" },
          req
        ),
      },
    }));
  }
  jsonReply(context, {
    links: {
      create: getEndpoint({ href: "token", method: "POST" }, req),
    },
    tokens,
  });
};
