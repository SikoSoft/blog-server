import { AzureFunction, Context } from "@azure/functions";
import { getConnection } from "../util/database";

const timerTrigger: AzureFunction = async function (
  context: Context
): Promise<void> {
  var date = new Date();
  const connection = await getConnection();
  const entries = await connection
    .select("id", "publish_at")
    .from("entries")
    .where("public", 0)
    .andWhere("publish_at", "!=", 0);
  entries.forEach((entry) => {
    if (date >= new Date(entry.publish_at * 1000)) {
      context.log(`entry ${entry} is ready to be published`);
      connection("entries")
        .update({
          public: 1,
          publish_at: 0,
          published_at: Math.floor(date.getTime() / 1000),
        })
        .where("id", entry.id);
    }
  });
};

export default timerTrigger;
