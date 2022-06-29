import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { getId, processEntry } from "../util/entries";
import { getLinks, hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import { flushState } from "../util/state";

const fieldsData = (fields: Array<string>, values: Array<any>) => {
  return fields.reduce((prev, cur) => ({ ...prev, [cur]: values[cur] }), {});
};

const syncTags = async (connection, id, tags) => {
  return new Promise<void>(async (resolve) => {
    await connection("entries_tags").delete().where("entry_id", id);
    if (tags && tags.length) {
      await connection
        .insert(tags.map((tag) => ({ tag })))
        .into("tags")
        .onConflict()
        .ignore();
      await connection("entries_tags").insert(
        tags.map((tag: string) => ({ entry_id: id, tag }))
      );
      flushState("entriesTags");
      resolve();
    } else {
      flushState("entriesTags");
      resolve();
    }
  });
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "entry"))) {
    crudViolation(context);
    return;
  }
  const connection = await getConnection();
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  if (["POST", "PUT"].includes(req.method)) {
    if (!body.title) {
      return jsonReply(context, { errorCode: 6 });
    } else if (!body.body) {
      return jsonReply(context, { errorCode: 7 });
    }
  }
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
  let entry;
  switch (req.method) {
    case "POST":
      fields.push("created");
      body.created = body.last_edited;
      body.id = await getId(body.title);
      await connection("entries").insert(fieldsData(fields, body));
      entry = await connection("entries")
        .select("*")
        .where("id", body.id)
        .first();
      break;
    case "PUT":
      fields.push("id");
      body.id = context.bindingData.id;
      await connection("entries")
        .update(fieldsData(fields, body))
        .where("id", context.bindingData.id);
      entry = await connection("entries")
        .select("*")
        .where("id", body.newId)
        .first();
      break;
    case "DELETE":
      body.id = context.bindingData.id;
      await connection("entries").delete().where("id", context.bindingData.id);
      break;
    default:
      entry = await connection("entries")
        .select("*")
        .where("id", context.bindingData.id)
        .first();
  }
  if (req.method !== "GET") {
    await syncTags(connection, body.id, body.tags ? body.tags : []);
  }
  jsonReply(context, {
    entry: entry ? await processEntry(req, entry) : {},
    links: await getLinks(req, "image"),
  });
};

export default httpTrigger;
