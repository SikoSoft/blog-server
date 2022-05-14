import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const {
  getConnection,
  getSettings,
  processEntry,
  getLastEntry,
  jsonReply,
  getExcludedEntries,
} = require("../util");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const settings = await getSettings();
  const connection = await getConnection();
  const excludedEntries = await getExcludedEntries(req.headers["sess-token"]);
  const drafts = req.headers.type && req.headers.type === "draft";
  const query = connection
    .select("*")
    .from("entries")
    .whereNotIn("id", excludedEntries)
    .andWhere({ listed: 1, public: drafts ? 0 : 1 });
  const lastEntryId = await getLastEntry(query.clone());
  context.log("lastEntryId", lastEntryId);
  const rawEntries = await query
    .orderBy("created", "desc")
    .offset(context.bindingData.start ? parseInt(context.bindingData.start) : 0)
    .limit(settings.per_load ? settings.per_load : 10);
  if (rawEntries.length) {
    const processedEntries = rawEntries.map((entry) =>
      processEntry(req, entry)
    );
    await Promise.all(processedEntries);
    const entries = [];
    await processedEntries.forEach(async (entry) => {
      await entry.then((data) => entries.push(data));
    });
    jsonReply(context, {
      [drafts ? "drafts" : "entries"]: entries,
      end: rawEntries[rawEntries.length - 1].id === lastEntryId,
    });
  } else {
    jsonReply(context, {
      [drafts ? "drafts" : "entries"]: [],
      end: true,
    });
  }
};

export default httpTrigger;
