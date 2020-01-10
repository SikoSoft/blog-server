const { db, getId } = require("../util");

module.exports = async function(context, req) {
  context.log("METHOD", req.method);
  await db.getConnection().then(async connection => {
    const body =
      typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
    let query = "";
    let where = "";
    let fields = ["id", "title", "body", "last_edited"];
    body.last_edited = Math.floor(new Date().getTime() / 1000);
    body.body = JSON.stringify(body.body);
    let values = [];
    switch (req.method) {
      case "POST":
        query = "INSERT INTO ";
        fields.push("created");
        body.created = body.last_edited;
        body.id = await getId(body.title);
        break;
      case "PUT":
        query = "UPDATE ";
        where = "WHERE id = ?";
        break;
      case "DELETE":
        query = "DELETE FROM ";
        where = "WHERE id = ?";
        fields = [];
        break;
      default:
        query = "SELECT * FROM ";
        fields = [];
    }
    query += "entries ";
    if (fields.length > 0) {
      query += `(${fields.join(",")}) `;
      query += `VALUES (${[...fields].fill("?").join(",")}) `;
    }
    values = fields.map(field => body[field]);
    if (where) {
      query += ` ${where}`;
      values.push(context.bindingData.id);
    }
    context.log("query", query);
    await connection.query(query, values).then(async qRes => {
      context.res = {
        status: 200,
        body: JSON.stringify({ id: body.id })
      };
    });
  });
};
