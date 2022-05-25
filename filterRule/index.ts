import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";

import {
  crudViolation,
  getConnection,
  hasLinkAccess,
  jsonReply,
} from "../util";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "filterRule"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  if (req.method === "POST") {
    const res = await connection("filters_rules")
      .insert({
        filter_id: context.bindingData.entryId,
        type: body.type,
        value: body.value,
        operator: body.operator,
      })
      .first();
    jsonReply(context, { id: res, success: true });
  } else if (req.method === "PUT") {
    await connection("filters_rules")
      .insert({
        filter_id: context.bindingData.entryId,
        type: body.type,
        value: body.value,
        operator: body.operator,
      })
      .onConflict("filter_key")
      .ignore();
    jsonReply(context, { success: true });
  } else if (req.method === "DELETE") {
    await connection("filter_rules").where("id", body.id).delete();
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
