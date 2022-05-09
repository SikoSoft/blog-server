const { db, getId, processEntry, jsonReply, flushState } = require("../util");

const syncTags = async (connection, id, tags) => {
  return new Promise(async (resolve) => {
    await connection.query("DELETE FROM entries_tags WHERE entry_id = ?", [id]);
    if (tags && tags.length) {
      await connection.query(
        `INSERT IGNORE INTO tags (tag) VALUES ${[...tags]
          .fill("(?)")
          .join(",")} `,
        tags
      );
      let entryTagsQuery = "REPLACE INTO entries_tags (entry_id, tag) ";
      entryTagsQuery += `VALUES ${[...tags].fill("(?, ?)").join(",")} `;
      await connection.query(
        entryTagsQuery,
        tags.map((tag) => [id, tag]).reduce((acc, arr) => [...acc, ...arr], [])
      );

      flushState("entriesTags");
      resolve();
    } else {
      flushState("entriesTags");
      resolve();
    }
  });
};

module.exports = async function (context, req) {
  const connection = await db.getConnection();
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
  let fields = [
    "id",
    "title",
    "body",
    "last_edited",
    "listed",
    "public",
    "publish_at",
    "published_at",
  ];
  body.last_edited = Math.floor(new Date().getTime() / 1000);
  body.listed = parseInt(body.listed) === 1 ? 1 : 0;
  body.publish_at = body.publishAt ? body.publishAt : 0;
  body.published_at = parseInt(body.public) === 1 ? body.last_edited : 0;
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
  const qRes = await connection.query(query, values);
  const sendResponse = async (entry) => {
    await processEntry(req, {
      id: req.method === "PUT" ? body.newId : body.id,
      ...entry,
    }).then((processedEntry) => {
      jsonReply(context, processedEntry);
    });
  };
  if (req.method !== "GET") {
    await syncTags(connection, body.id, body.tags);
    await sendResponse();
  } else {
    await sendResponse(qRes[0]);
  }
};
