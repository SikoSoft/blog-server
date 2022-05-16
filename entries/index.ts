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
  req: HttpRequest,
  drafts: boolean = false
): Promise<any> {
  context.log("inside entries...");
  const settings = await getSettings();
  const connection = await getConnection();
  const excludedEntries = await getExcludedEntries(req.headers["sess-token"]);
  //const drafts = req.headers.type && req.headers.type === "draft";
  const query = connection
    .select("*")
    .from("entries")
    .whereNotIn("id", excludedEntries)
    .andWhere({ listed: 1, public: drafts ? 0 : 1 });
  console.log("FIRST", query.toSQL().toNative());
  const lastEntryId = await getLastEntry(query.clone());
  const rawEntries = await query
    .clone()
    .orderBy("created", "desc")
    .offset(context.bindingData.start ? parseInt(context.bindingData.start) : 0)
    .limit(settings.per_load ? settings.per_load : 10);
  console.log("SECOND", query.toSQL().toNative());
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
    console.log("ahhhh shit");
    jsonReply(context, {
      [drafts ? "drafts" : "entries"]: [],
      end: true,
    });
  }
};

export default httpTrigger;
