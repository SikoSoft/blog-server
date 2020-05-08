const entries = require("../entries/");

module.exports = async function(context, req) {
  req.drafts = true;
  await entries(context, req);
};
