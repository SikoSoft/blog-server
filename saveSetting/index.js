const { db, jsonReply, flushState } = require("../util");
const spec = require("blog-spec");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await db.getConnection();
  const setting = spec.settings.filter((setting) => setting.id === body.id)[0];
  const field =
    spec.typeMap[setting.dataType ? setting.dataType : setting.type];
  const qRes = await connection.query(
    `REPLACE INTO settings (id, \`${field}\`) VALUES(?, ?)`,
    [body.id, body.value]
  );
  const success = qRes.affectedRows >= 1 ? true : false;
  if (success) {
    flushState("settings");
  }
  jsonReply(context, { success });
};
