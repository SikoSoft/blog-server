import axios from "axios";
import { errorCodes } from "blog-spec";
import { parse } from "query-string";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { SentimentAnalysisResponse } from "../interfaces/SentimentAnalysisResponse";
import { Knex } from "knex";
import { verifyCaptcha } from "../util/captcha";
import { getSettings } from "../util/config";
import { getTextFromDelta } from "../util/data";
import { getConnection } from "../util/database";
import { hasLinkAccess, getLinks } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import { getIp } from "../util/session";

const getSentimentScore = async (text: string): Promise<any> => {
  const settings = await getSettings();
  if (
    !settings.analyze_comments_sentiment ||
    !process.env.AZURE_SENTIMENT_ENDPOINT ||
    !process.env.AZURE_COGNITIVE_SERVICES_KEY
  ) {
    return Promise.resolve(false);
  }
  return new Promise(async (resolve) => {
    const response = await axios.post<SentimentAnalysisResponse>(
      process.env.AZURE_SENTIMENT_ENDPOINT,
      JSON.stringify({
        documents: [
          {
            language: "en",
            id: 1,
            text,
          },
        ],
      }),
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_COGNITIVE_SERVICES_KEY,
          "content-type": "application/json",
        },
      }
    );
    if (response && response.data.documents && response.data.documents.length) {
      resolve(response.data.documents[0].score);
    }
    resolve(0);
  });
};

const addComment = async (
  context: Context,
  req: HttpRequest,
  connection: Knex<any>,
  body: any
): Promise<any> => {
  if (!(await hasLinkAccess(req, req.method, "comment"))) {
    crudViolation(context);
    return;
  }
  const settings = await getSettings();
  let captchaCompliant = true;
  if (settings.use_captcha) {
    captchaCompliant = await verifyCaptcha(body.captchaToken, getIp(req));
  }

  if (captchaCompliant) {
    body.message = JSON.stringify(body.message);
    body.entry_id = body.entryId;
    body.time = Math.ceil(new Date().getTime() / 1000);
    const fields = ["entry_id", "name", "message", "time"];
    const values = fields.map((field) => body[field]);

    let score = 0;
    if (settings.analyze_comments_sentiment) {
      score = await getSentimentScore(
        getTextFromDelta(JSON.parse(body.message))
      );
    }

    if (score && settings.min_score_auto_publish) {
      fields.push("public");
      values.push(score >= settings.min_score_auto_publish ? 1 : 0);
    }
    const data = fields.reduce(
      (prev, cur, index) => ({ ...prev, [cur]: values[index] }),
      {}
    );
    const qRes = await connection("comments").insert(data);
    const comment = {
      id: qRes[0],
      entry_id: body.entry_id,
      name: body.name,
      message: body.message,
      time: body.time,
      links: await getLinks(req, "comment", qRes[0]),
    };
    if (score) {
      await connection("comments_scores").insert({
        comment_id: qRes,
        score,
      });
      jsonReply(context, { comment, score });
    } else {
      jsonReply(context, { comment });
    }
  } else {
    jsonReply(
      context,
      {
        errorCode: errorCodes.ERROR_CAPTCHA_FAILED,
      },
      500
    );
  }
};

const updateComment = async (
  context: Context,
  connection: Knex<any>,
  body: any
): Promise<any> => {
  const result = await connection("comments")
    .update(body)
    .where("id", context.bindingData.id);
  jsonReply(context, { result });
};

const deleteComment = async (
  context: Context,
  connection: Knex<any>
): Promise<any> => {
  const result = await connection("comments")
    .delete()
    .where("id", context.bindingData.id);
  jsonReply(context, { result });
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};

  const connection = await getConnection();
  switch (req.method) {
    case "POST":
      await addComment(context, req, connection, body);
      break;
    case "PUT":
      await updateComment(context, connection, body);
      break;
    case "DELETE":
      await deleteComment(context, connection);
      break;
  }
};

export default httpTrigger;
