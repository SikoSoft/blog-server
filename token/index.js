const { db, jsonReply, getEndpoint } = require("../util.js");

const getToken = async (connection, req, code) => {
  const [token] = await connection.query(
    "SELECT * FROM tokens WHERE code = ?",
    [code]
  );
  token.links = {
    update: getEndpoint({ href: `token/${code}`, method: "PUT" }, req),
    delete: getEndpoint({ href: `token/${code}`, method: "DELETE" }, req),
  };
  return token;
};

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await db.getConnection();
  if (req.method === "POST") {
    await connection.query(
      "INSERT INTO tokens (code, one_time, role) VALUES(?, ?, ?)",
      [body.code, body.one_time, body.role]
    );
    jsonReply(context, {
      token: await getToken(connection, req, body.code),
    });
  } else if (req.method === "PUT") {
    await connection.query(
      "UPDATE tokens SET one_time = ?, role = ? WHERE code = ?",
      [body.one_time, body.role, context.bindingData.code]
    );
    jsonReply(context, {
      token: await getToken(connection, req, context.bindingData.code),
    });
  } else if (req.method === "DELETE") {
    const result = await connection.query("DELETE FROM tokens WHERE code = ?", [
      context.bindingData.code,
    ]);
    jsonReply(context, { success: result.affectedRows > 0 });
  }
};
