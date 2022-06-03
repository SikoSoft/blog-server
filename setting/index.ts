import spec = require("blog-spec");
import { parse } from "query-string";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConnection } from "../util/database";
import { jsonReply } from "../util/reply";
import { flushState } from "../util/state";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  const setting = spec.settings.filter(
    (setting) => setting.id === context.bindingData.id
  )[0];
  const field = setting.dataType || spec.typeMap[setting.type];
  const qRes = await connection("settings")
    .insert({ id: context.bindingData.id, [field]: body.value })
    .onConflict("id")
    .merge();
  const success = qRes.length >= 1 ? true : false;
  if (success) {
    flushState("settings");
  }
  jsonReply(context, { success });
};

export default httpTrigger;
