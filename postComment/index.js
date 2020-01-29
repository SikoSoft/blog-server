const { db } = require("../util");

module.exports = async function(context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  body.message = JSON.stringify(body.message);
  body.entry_id = context.bindingData.id;
  body.time = Math.ceil(new Date().getTime() / 1000);

  const fields = ["entry_id", "name", "message", "time"];
  const values = fields.map(field => body[field]);

  await db.getConnection().then(async connection => {
    await connection
      .query(
        `INSERT INTO comments (${fields.join(",")}) VALUES(${[...fields]
          .fill("?")
          .join(",")})`,
        values
      )
      .then(qRes => {
        context.res = {
          status: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({})
        };
      });
  });
};
