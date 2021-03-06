const { db, jsonReply } = require("../util");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await db.getConnection().then(async (connection) => {
    if (body.orderedFilters) {
      await body.orderedFilters.forEach(async (filter, index) => {
        connection
          .query("UPDATE filters SET `order` = ? WHERE id = ?", [index, filter])
          .then(async () => {});
      });
      jsonReply(context, { success: true });
    } else {
      context.res = {
        status: 400,
      };
    }
  });
};
