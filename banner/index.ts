import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "banner"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const connection = await getConnection();
  let banner;
  switch (req.method) {
    case "POST":
      const id = await connection("banners").insert(body);
      banner = await connection
        .select("*")
        .from("banners")
        .where("id", id)
        .first();
      jsonReply(context, {
        banner: {
          ...banner,
          links: await getLinks(req, "banner", id),
        },
      });
      break;
    case "PUT":
      await connection("banners")
        .update(body)
        .where("id", context.bindingData.id);
      banner = await connection
        .select("*")
        .from("banners")
        .where("id", context.bindingData.id)
        .first();
      jsonReply(context, {
        banner: {
          ...banner,
          links: await getLinks(req, "banner", context.bindingData.id),
        },
      });
      break;
    case "DELETE":
      await connection("banners").delete().where("id", context.bindingData.id);
      jsonReply(context, {});
      break;
  }
};

export default httpTrigger;
