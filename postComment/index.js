const { db, verifyCaptcha, getIp } = require("../util");
const { ERROR_CAPTCHA_FAILED } = require("../errorCodes");

module.exports = async function(context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await verifyCaptcha(body.captchaToken, getIp(req)).then(
    async captchaResponse => {
      if (captchaResponse.success) {
        body.message = JSON.stringify(body.message);
        body.entry_id = context.bindingData.id;
        body.time = Math.ceil(new Date().getTime() / 1000);
        const fields = ["entry_id", "name", "message", "time"];
        const values = fields.map(field => body[field]);
        await db.getConnection().then(async connection => {
          await connection
            .query(
              `INSERT INTO comments (${fields.join(",")}) VALUES(${[...fields]
                .fill("?")
                .join(",")})`,
              values
            )
            .then(qRes => {
              context.res = {
                status: 200,
                headers: {
                  "content-type": "application/json"
                },
                body: JSON.stringify({})
              };
            });
        });
      } else {
        context.res = {
          status: 500,
          body: JSON.stringify({
            errorCode: ERROR_CAPTCHA_FAILED
          })
        };
      }
    }
  );
};
