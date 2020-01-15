const { db, getId } = require("../util");

module.exports = async function(context, req) {
  await db.getConnection().then(async connection => {
    const body =
      typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
    let query = "";
    let set = "";
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
        set = " SET";
        where = "WHERE id = ?";
        body.id = context.bindingData.id;
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
    if (set) {
      query += `${set} `;
      query += fields.map(field => `${field} = ?`).join(", ");
    } else if (fields.length > 0) {
      query += `(${fields.join(",")}) `;
      query += `VALUES (${[...fields].fill("?").join(",")}) `;
    }
    values = fields.map(field => body[field]);
    if (where) {
      query += ` ${where}`;
      values.push(context.bindingData.id);
    }
    await connection.query(query, values).then(async qRes => {
      const sendResponse = () => {
        context.res = {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: body.id })
        };
      };
      if (body.tags && body.tags.length) {
        let tagQuery = "INSERT IGNORE INTO tags (tag) ";
        tagQuery += `VALUES ${[...body.tags].fill("(?)").join(",")} `;
        await connection.query(tagQuery, body.tags).then(async () => {
          let entryTagsQuery = "REPLACE INTO entries_tags (entry_id, tag) ";
          entryTagsQuery += `VALUES ${[...body.tags]
            .fill("(?, ?)")
            .join(",")} `;
          await connection
            .query(
              entryTagsQuery,
              body.tags
                .map(tag => [body.id, tag])
                .reduce((acc, arr) => [...acc, ...arr], [])
            )
            .then(() => {
              sendResponse();
            });
        });
      } else {
        sendResponse();
      }
    });
  });
};
