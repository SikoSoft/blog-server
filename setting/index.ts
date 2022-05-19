import { getConnection, jsonReply, flushState } from "../util";
import spec = require("blog-spec");
import { parse } from "query-string";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await getConnection();
  const setting = spec.settings.filter((setting) => setting.id === body.id)[0];
  const field =
    spec.typeMap[setting.dataType ? setting.dataType : setting.type];
  const qRes = await connection("settings")
    .insert({ id: body.id, [field]: body.value })
    .onConflict("id")
    .merge();
  const success = qRes.length >= 1 ? true : false;
  if (success) {
    flushState("settings");
  }
  jsonReply(context, { success });
};

export default httpTrigger;
