const { db, jsonReply } = require("../util.js");

module.exports = async function (context, req) {
  await db.getConnection().then(async (connection) => {
    await connection
      .query("SELECT * FROM filters_rules WHERE filter_id = ?", [
        context.bindingData.id,
      ])
      .then(async (rules) => {
        const tagsToCheck = [];
        rules.forEach((filter) => {
          if (filter.type === "tag") {
            tagsToCheck.push(filter.value);
          }
        });

        let entriesTags = {};
        await connection
          .query(
            `SELECT * FROM entries_tags WHERE ${[...tagsToCheck]
              .fill("tag = ?")
              .join(" || ")}`,
            tagsToCheck
          )
          .then(async (tagsRows) => {
            tagsRows.forEach((tagRow) => {
              entriesTags[tagRow.entry_id] = entriesTags[tagRow.entry_id]
                ? [...entriesTags[tagRow.entry_id], tagRow.tag]
                : [tagRow.tag];
            });
          });

        const filteredByTags = [];
        Object.keys(entriesTags).forEach((entryId) => {
          let matchesAll = true;
          rules.forEach((filter) => {
            if (filter.type === "tag") {
              if (
                !(
                  filter.operator === "=" &&
                  entriesTags[entryId].includes(filter.value)
                ) &&
                !(
                  filter.operator === "!=" &&
                  !entriesTags[entryId].includes(filter.value)
                )
              ) {
                matchesAll = false;
              }
            }
          });
          if (matchesAll) {
            filteredByTags.push(entryId);
          }
        });

        await connection
          .query(
            `SELECT * FROM entries WHERE ${[...filteredByTags]
              .fill("id = ?")
              .join(" || ")} ORDER BY created DESC`,
            filteredByTags
          )
          .then(async (entries) => {
            jsonReply(context, { entries });
          });
      });
  });
};
