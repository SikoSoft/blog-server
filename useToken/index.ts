import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";
import { v4 } from "uuid";
import { errorCodes } from "blog-spec";
import { getSettings } from "../util/config";
import { getConnection } from "../util/database";
import { hasLinkAccess } from "../util/links";
import { jsonReply, crudViolation } from "../util/reply";
import { getIp } from "../util/session";

const getFailedAttempts = async (ip: string, time: number): Promise<number> => {
  const connection = await getConnection();
  const records = await connection
    .select("time")
    .from("tokens_invalid_attempts")
    .where("ip", ip)
    .andWhere("time", ">", time);
  return records.length;
};

const floodReply = (context: Context): void => {
  jsonReply(context, { errorCode: errorCodes.ERROR_FLOOD_DETECTED });
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  if (!(await hasLinkAccess(req, req.method, "useToken"))) {
    crudViolation(context);
    return;
  }
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const settings = await getSettings();
  const ip = getIp(req);
  const now = Math.floor(new Date().getTime() / 1000);
  const failedAttempts = await getFailedAttempts(
    ip,
    now - settings.token_flood_timespan
  );
  if (failedAttempts >= settings.token_flood_attempts) {
    floodReply(context);
    return;
  }
  const connection = await getConnection();
  const qRes = await connection
    .select("*")
    .from("tokens")
    .where("code", body.code);

  if (qRes.length) {
    const tokenRow = qRes[0];
    if (tokenRow.one_time === 1 && tokenRow.consumed > 0) {
      jsonReply(
        context,
        {
          errorCode: errorCodes.ERROR_TOKEN_CONSUMED,
        },
        500
      );
    } else {
      await connection("tokens")
        .update("consumed", tokenRow.consumed + 1)
        .where("code", tokenRow.code);

      const sessToken = v4();
      await connection("tokens_consumed").insert({
        code: tokenRow.code,
        ip,
        time: now,
        session: sessToken,
      });
      const roleRes = await connection
        .select("token")
        .from("roles")
        .where("id", tokenRow.role)
        .first();
      jsonReply(context, {
        role: tokenRow.role,
        sessToken,
        authToken: roleRes.token,
      });
    }
  } else {
    await connection("tokens_invalid_attempts").insert({
      code: body.code,
      ip,
      time: now,
    });
    if (failedAttempts + 1 >= settings.token_flood_attempts) {
      floodReply(context);
      return;
    }
    jsonReply(context, {
      errorCode: errorCodes.ERROR_INVALID_TOKEN,
    });
  }
};

export default httpTrigger;
