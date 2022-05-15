import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "query-string";

import { v4 } from "uuid";
import { getConnection, getIp } from "../util";
import { errorCodes } from "blog-spec";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const ip = getIp(req);
  const now = Math.floor(new Date().getTime() / 1000);
  const connection = await getConnection();
  const qRes = await connection
    .select("*")
    .from("tokens")
    .where("code", body.code);

  if (qRes.length) {
    const tokenRow = qRes[0];
    if (tokenRow.one_time === 1 && tokenRow.consumed > 0) {
      context.res = {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          errorCode: errorCodes.ERROR_TOKEN_CONSUMED,
        }),
      };
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
        .where("id", tokenRow.role);
      context.res = {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          role: tokenRow.role,
          sessToken,
          authToken: roleRes[0].code,
        }),
      };
    }
  } else {
    await connection("tokens_invalid_attempts").insert({
      code: body.code,
      ip,
      time: now,
    });
    context.res = {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        errorCode: errorCodes.ERROR_INVALID_TOKEN,
      }),
    };
  }
};

export default httpTrigger;
