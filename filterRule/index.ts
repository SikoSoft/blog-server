import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

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
    const res = await connection("filters_rules").insert({
      filter_id: body.filter,
      type: body.type,
      value: body.value,
      operator: body.operator,
    });
    const filterRule = await connection
      .select("*")
      .from("filters_rules")
      .where("id", res[0])
      .first();
    jsonReply(context, {
      id: res,
      success: true,
      filterRule: {
        ...filterRule,
        links: await getLinks(req, "filterRule", res[0]),
      },
    });
  } else if (req.method === "PUT") {
    await connection("filters_rules")
      .update({
        filter_id: body.filter,
        type: body.type,
        value: body.value,
        operator: body.operator,
      })
      .where("id", context.bindingData.filterRule);
    const filterRule = await connection
      .select("*")
      .from("filters_rules")
      .where("id", context.bindingData.filterRule)
      .first();
    jsonReply(context, {
      success: true,
      filterRule: {
        ...filterRule,
        links: await getLinks(
          req,
          "filterRule",
          context.bindingData.filterRule
        ),
      },
    });
  } else if (req.method === "DELETE") {
    await connection("filters_rules")
      .where("id", context.bindingData.filterRule)
      .delete();
    jsonReply(context, { success: true });
  }
};

export default httpTrigger;
