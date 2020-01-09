const { mockEntries } = require("../util");

module.exports = async function(context, req) {
  context.res = {
    status: 200,
    body: JSON.stringify({ entries: mockEntries() })
  };
};
