import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getSettings } from "../util/config";
import { getConnection } from "../util/database";
import { getLastEntry, processEntry } from "../util/entries";
import { getLinks, hasLinkAccess } from "../util/links.js";
import { crudViolation, jsonReply } from "../util/reply";

export const getFiltersRules = async (): Promise<any> => {
  const connection = await getConnection();
  const filtersRules = await connection.select("*").from("filters_rules");
  return filtersRules;
};

export const processFilter = async (
  req: HttpRequest,
  filter: any
): Promise<any> => {
  const filtersRules = await getFiltersRules();
  return {
    ...filter,
    rules: await Promise.all(
      filtersRules
        .filter((rule) => rule.filter_id === filter.id)
        .map(async (rule) => ({
          ...rule,
          links: await getLinks(req, "filterRule", rule.id),
        }))
    ),
    links: [
      ...(await getLinks(req, "filter", filter.id)),
      ...(await getLinks(req, "filterRule")),
      ...(await getLinks(req, "uploadImage", "filter")),
    ],
  };
};

const getBodyData = (body: Record<string, any>): Record<string, any> => {
  return {
    ...(body.newId ? { id: body.newId } : {}),
    ...(body.label ? { label: body.label } : {}),
    ...(body.image ? { image: body.image } : {}),
    ...(body.order ? { order: body.order } : {}),
  };
};

export const run: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "filter"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const settings = await getSettings();
  const connection = await getConnection();
  if (req.method === "POST") {
    const res = await connection("filters").insert({
      id: body.id,
      label: body.label,
      image: body.image,
    });
    const filter = await connection
      .select("*")
      .from("filters")
      .where("id", body.id)
      .first();
    jsonReply(context, {
      success: res.length === 1,
      filter: await processFilter(req, filter),
    });
  } else if (req.method === "PUT") {
    const res = await connection("filters")
      .update(getBodyData(body))
      .where("id", context.bindingData.id);
    const filter = await connection
      .select("*")
      .from("filters")
      .where("id", body.newId || context.bindingData.id)
      .first();
    jsonReply(context, {
      success: res === 1,
      filter: await processFilter(req, filter),
    });
  } else if (req.method === "DELETE") {
    const res = await connection("filters")
      .where("id", context.bindingData.id)
      .delete();
    jsonReply(context, { success: res === 1 });
  } else {
    const rules = await connection
      .select("*")
      .from("filters_rules")
      .where("filter_id", context.bindingData.id);
    const tagsToCheck = [];
    rules.forEach((filter) => {
      if (filter.type === "tag") {
        tagsToCheck.push(filter.value);
      }
    });
    let entriesTags = {};
    const tagsRows = await connection
      .select("*")
      .from("entries_tags")
      .whereIn("tag", tagsToCheck);

    tagsRows.forEach((tagRow) => {
      entriesTags[tagRow.entry_id] = entriesTags[tagRow.entry_id]
        ? [...entriesTags[tagRow.entry_id], tagRow.tag]
        : [tagRow.tag];
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
    const query = connection
      .select("*")
      .from("entries")
      .whereIn("id", filteredByTags)
      .andWhere("listed", 1);
    const lastEntryId = await getLastEntry(query.clone());
    const rawEntries = await query
      .clone()
      .orderBy("created", "desc")
      .offset(
        context.bindingData.start ? parseInt(context.bindingData.start) : 0
      )
      .limit(settings.per_load ? settings.per_load : 10);

    const processedEntries = rawEntries.map((entry) =>
      processEntry(req, entry)
    );
    await Promise.all(processedEntries);
    const entries = [];
    await processedEntries.forEach(async (entry) => {
      await entry.then((data) => entries.push(data));
    });

    jsonReply(context, {
      entries,
      end:
        entries.length === 0
          ? true
          : entries[entries.length - 1].id === lastEntryId,
    });
  }
};

export default run;
