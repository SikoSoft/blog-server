const { db, baseUrl, getEndpoint } = require("../util");
const {
  ERROR_INVALID_TOKEN,
  ERROR_TOKEN_CONSUMED
} = require("../errorCodes.js");

module.exports = async function(context, req) {
  const body =
    typeof req.body === "string" ? parse(req.body) : req.body ? req.body : {};
  await db.getConnection().then(async dbCon => {
    await dbCon
      .query("SELECT * FROM tokens WHERE token = ?", [body.token])
      .then(async qRes => {
        if (qRes.length) {
          const tokenRow = qRes[0];
          if (tokenRow.one_time === 1 && tokenRow.consumed > 0) {
            context.res = {
              status: 500,
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                errorCode: ERROR_TOKEN_CONSUMED
              })
            };
          } else {
            await dbCon
              .query("UPDATE tokens SET consumed = ? WHERE token = ?", [
                tokenRow.consumed + 1,
                tokenRow.token
              ])
              .then(async () => {
                await dbCon
                  .query(
                    "INSERT INTO tokens_consumed (token, ip, time) VALUES(?, ?, ?)",
                    [
                      tokenRow.token,
                      req.headers["x-forwarded-for"]
                        ? req.headers["x-forwarded-for"]
                        : "0.0.0.0",
                      Math.floor(new Date().getTime() / 1000)
                    ]
                  )
                  .then(async () => {
                    await dbCon
                      .query("SELECT token FROM roles WHERE id = ?", [
                        tokenRow.role
                      ])
                      .then(roleRes => {
                        context.res = {
                          status: 200,
                          headers: {
                            "content-type": "application/json"
                          },
                          body: JSON.stringify({
                            role: tokenRow.role,
                            token: roleRes[0].token
                          })
                        };
                      });
                  });
              });
          }
        } else {
          context.res = {
            status: 500,
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              errorCode: ERROR_INVALID_TOKEN
            })
          };
        }
      });
  });
};
