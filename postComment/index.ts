import axios from "axios";
import {
  getConnection,
  getSettings,
  verifyCaptcha,
  getIp,
  jsonReply,
  getTextFromDelta,
} from "../util";
import { errorCodes } from "blog-spec";
import { parse } from "query-string";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { SentimentAnalysisResponse } from "../interfaces/SentimentAnalysisResponse";

const getSentimentScore = async (text: string): Promise<any> => {
  if (
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
    resolve(false);
  });
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const captchaResponse = await verifyCaptcha(body.captchaToken, getIp(req));

  if (captchaResponse.success) {
    body.message = JSON.stringify(body.message);
    body.entry_id = context.bindingData.id;
    body.time = Math.ceil(new Date().getTime() / 1000);
    const fields = ["entry_id", "name", "message", "time"];
    const values = fields.map((field) => body[field]);
    const connection = await getConnection();
    const score = await getSentimentScore(
      getTextFromDelta(JSON.parse(body.message))
    );
    const settings = await getSettings();
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
      id: qRes,
      entry_id: body.entry_id,
      name: body.name,
      message: body.message,
      time: body.time,
    };
    if (score) {
      await connection("comments_scores").insert({ comment_id: qRes, score });

      jsonReply(context, { ...comment, score });
    } else {
      jsonReply(context, comment);
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

export default httpTrigger;
