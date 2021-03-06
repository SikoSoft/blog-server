const fetch = require("node-fetch");
const {
  db,
  getSettings,
  verifyCaptcha,
  getIp,
  jsonReply,
  getTextFromDelta,
} = require("../util");
const { ERROR_CAPTCHA_FAILED } = require("../errorCodes");

const getSentimentScore = async (text) => {
  if (
    !process.env.AZURE_SENTIMENT_ENDPOINT ||
    !process.env.AZURE_COGNITIVE_SERVICES_KEY
  ) {
    return Promise.resolve(false);
  }
  return new Promise((resolve, reject) => {
    fetch(process.env.AZURE_SENTIMENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_COGNITIVE_SERVICES_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        documents: [
          {
            language: "en",
            id: 1,
            text,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json && json.documents && json.documents.length) {
          resolve(json.documents[0].score);
        }
        resolve(false);
      })
      .catch((e) => reject(e));
  });
};

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await verifyCaptcha(body.captchaToken, getIp(req)).then(
    async (captchaResponse) => {
      if (captchaResponse.success) {
        body.message = JSON.stringify(body.message);
        body.entry_id = context.bindingData.id;
        body.time = Math.ceil(new Date().getTime() / 1000);
        const fields = ["entry_id", "name", "message", "time"];
        const values = fields.map((field) => body[field]);
        await db.getConnection().then(async (connection) => {
          await getSentimentScore(
            getTextFromDelta(JSON.parse(body.message))
          ).then(async (score) => {
            await getSettings().then(async (settings) => {
              if (score && settings.min_score_auto_publish) {
                fields.push("public");
                values.push(score >= settings.min_score_auto_publish ? 1 : 0);
              }
              await connection
                .query(
                  `INSERT INTO comments (${fields.join(",")}) VALUES(${[
                    ...fields,
                  ]
                    .fill("?")
                    .join(",")})`,
                  values
                )
                .then(async (qRes) => {
                  const comment = {
                    id: qRes.insertId,
                    entry_id: body.entry_id,
                    name: body.name,
                    message: body.message,
                    time: body.time,
                  };

                  if (score) {
                    await connection
                      .query(
                        "INSERT INTO comments_scores (comment_id, score) VALUES(?, ?)",
                        [qRes.insertId, score]
                      )
                      .then(async () => {
                        jsonReply(context, { ...comment, score });
                      });
                  } else {
                    jsonReply(context, comment);
                  }
                });
            });
          });
        });
      } else {
        context.res = {
          status: 500,
          body: JSON.stringify({
            errorCode: ERROR_CAPTCHA_FAILED,
          }),
        };
      }
    }
  );
};
