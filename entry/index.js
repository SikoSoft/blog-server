const { db, getId, processEntry, jsonReply } = require("../util");

const syncTags = async (connection, id, tags) => {
  return new Promise((resolve) => {
    connection
      .query("DELETE FROM entries_tags WHERE entry_id = ?", [id])
      .then(async () => {
        if (tags && tags.length) {
          let tagQuery = "INSERT IGNORE INTO tags (tag) ";
          tagQuery += `VALUES ${[...tags].fill("(?)").join(",")} `;
          await connection.query(tagQuery, tags).then(async () => {
            let entryTagsQuery = "REPLACE INTO entries_tags (entry_id, tag) ";
            entryTagsQuery += `VALUES ${[...tags].fill("(?, ?)").join(",")} `;
            await connection
              .query(
                entryTagsQuery,
                tags
                  .map((tag) => [id, tag])
                  .reduce((acc, arr) => [...acc, ...arr], [])
              )
              .then(() => {
                resolve();
              });
          });
        } else {
          resolve();
        }
      });
  });
};

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    const body =
      typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

    if (["POST", "PUT"].includes(req.method)) {
      if (!body.title) {
        return jsonReply(context, { errorCode: 6 });
      } else if (!body.body) {
        return jsonReply(context, { errorCode: 7 });
      }
    }
    let query = "";
    let set = "";
    let where = "";
    let fields = ["id", "title", "body", "last_edited", "public"];
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
        fields.push("id");
        body.id = context.bindingData.id;
        break;
      case "DELETE":
        query = "DELETE FROM ";
        where = "WHERE id = ?";
        body.id = context.bindingData.id;
        fields = [];
        break;
      default:
        query = "SELECT * FROM ";
        where = "WHERE id = ?";
        body.id = context.bindingData.id;
        fields = [];
    }
    query += "entries ";
    if (set) {
      query += `${set} `;
      query += fields.map((field) => `${field} = ?`).join(", ");
    } else if (fields.length > 0) {
      query += `(${fields.join(",")}) `;
      query += `VALUES (${[...fields].fill("?").join(",")}) `;
    }
    values = fields.map((field) =>
      field === "id" && req.method === "PUT" ? body.newId : body[field]
    );
    if (where) {
      query += ` ${where}`;
      values.push(context.bindingData.id);
    }
    await connection.query(query, values).then(async (qRes) => {
      const sendResponse = async (entry) => {
        await processEntry(req, {
          id: req.method === "PUT" ? body.newId : body.id,
          ...entry,
        }).then((processedEntry) => {
          jsonReply(context, processedEntry);
        });
      };
      if (req.method !== "GET") {
        await syncTags(connection, body.id, body.tags).then(async () => {
          await sendResponse();
        });
      } else {
        await sendResponse(qRes[0]);
      }
    });
  });
};
