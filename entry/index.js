const { db, getId, processEntry } = require("../util");

const syncTags = async (connection, id, tags) => {
  return new Promise((resolve, reject) => {
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

const getTags = async (connection, id) => {
  return new Promise((resolve, reject) => {
    connection
      .query("SELECT * FROM entries_tags WHERE entry_id = ?", [id])
      .then((tags) => {
        resolve(tags);
      });
  }).catch((e) => reject(e));
};

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    const body =
      typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
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
      const sendResponse = (entry, tags) => {
        context.res = {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            processEntry(
              req,
              { id: req.method === "PUT" ? body.newId : body.id, ...entry },
              tags ? tags : []
            )
          ),
        };
      };
      if (req.method !== "GET") {
        await syncTags(connection, body.id, body.tags).then(() => {
          sendResponse();
        });
      } else {
        await getTags(connection, body.id).then((tags) => {
          sendResponse(qRes[0], tags);
        });
      }
    });
  });
};
