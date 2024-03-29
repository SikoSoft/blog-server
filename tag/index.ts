import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getConnection,
  jsonReply,
  processEntry,
  getSettings,
  getLastEntry,
} from "../util.js";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const settings = await getSettings();
  const connection = await getConnection();
  const tagEntries = await connection
    .select("*")
    .from("entries_tags")
    .where("tag", context.bindingData.tag);

  const entriesWithTag = tagEntries.map((tagEntry) => tagEntry.entry_id);
  const query = connection
    .select("*")
    .from("entries")
    .whereIn("id", entriesWithTag)
    .andWhere("listed", 1)
    .andWhere("public", 1);
  const lastEntryId = await getLastEntry(query.clone());
  const rawEntries = await query
    .clone()
    .orderBy("created", "desc")
    .offset(context.bindingData.start ? parseInt(context.bindingData.start) : 0)
    .limit(settings.per_load ? settings.per_load : 10);
  const entries = [];
  for (const entry of rawEntries) {
    entries.push(await processEntry(req, entry));
  }
  jsonReply(context, {
    entries,
    end:
      entries.length === 0
        ? true
        : entries[entries.length - 1].id === lastEntryId,
  });
};

export default httpTrigger;
