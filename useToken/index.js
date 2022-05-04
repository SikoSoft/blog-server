const { v4 } = require("uuid");
const { db, getIp } = require("../util");
const {
  errorCodes: { ERROR_INVALID_TOKEN, ERROR_TOKEN_CONSUMED },
} = require("blog-spec");

module.exports = async function (context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  const ip = getIp(req);
  const now = Math.floor(new Date().getTime() / 1000);
  await db.getConnection().then(async (dbCon) => {
    await dbCon
      .query("SELECT * FROM tokens WHERE code = ?", [body.code])
      .then(async (qRes) => {
        if (qRes.length) {
          const tokenRow = qRes[0];
          if (tokenRow.one_time === 1 && tokenRow.consumed > 0) {
            context.res = {
              status: 500,
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                errorCode: ERROR_TOKEN_CONSUMED,
              }),
            };
          } else {
            await dbCon
              .query("UPDATE tokens SET consumed = ? WHERE code = ?", [
                tokenRow.consumed + 1,
                tokenRow.code,
              ])
              .then(async () => {
                const sessToken = v4();
                await dbCon
                  .query(
                    "INSERT INTO tokens_consumed (code, ip, time, session) VALUES(?, ?, ?, ?)",
                    [tokenRow.code, ip, now, sessToken]
                  )
                  .then(async () => {
                    await dbCon
                      .query("SELECT token FROM roles WHERE id = ?", [
                        tokenRow.role,
                      ])
                      .then((roleRes) => {
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
                      });
                  });
              });
          }
        } else {
          await dbCon
            .query(
              "INSERT INTO tokens_invalid_attempts (code, ip, time) VALUES(?, ?, ?)",
              [body.code, ip, now]
            )
            .then(() => {
              context.res = {
                status: 500,
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  errorCode: ERROR_INVALID_TOKEN,
                }),
              };
            });
        }
      });
  });
};
