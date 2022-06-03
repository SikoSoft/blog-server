import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getSettings } from "../util/config";
import { getConnection } from "../util/database";
import {
  getExcludedEntries,
  getLastEntry,
  processEntry,
} from "../util/entries";
import { getLinks, hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  drafts: boolean = false
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "entries"))) {
    crudViolation(context);
    return;
  }
  const type = drafts ? "drafts" : "entries";
  const offset = context.bindingData.start
    ? parseInt(context.bindingData.start)
    : 0;
  const settings = await getSettings();
  const connection = await getConnection();
  const excludedEntries = await getExcludedEntries(req.headers["sess-token"]);
  const query = connection
    .select("*")
    .from("entries")
    .whereNotIn("id", excludedEntries)
    .andWhere({ listed: 1, public: drafts ? 0 : 1 });
  const lastEntryId = await getLastEntry(query.clone());
  const rawEntries = await query
    .clone()
    .orderBy("created", "desc")
    .offset(offset)
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
    const end = rawEntries[rawEntries.length - 1].id === lastEntryId;
    jsonReply(context, {
      [drafts ? "drafts" : "entries"]: entries,
      end,
      links: !end
        ? await getLinks(req, type, offset + settings.per_load, "more")
        : [],
    });
  } else {
    jsonReply(context, {
      [type]: [],
      end: true,
    });
  }
};

export default httpTrigger;
