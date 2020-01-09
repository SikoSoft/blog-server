const { mockEntries } = require("../util");

module.exports = async function(context, req) {
  context.res = {
    status: 200,
    body: mockEntries()
      .map(entry => entry.tags)
      .reduce((accumulator = [], tags) => [...accumulator, ...tags])
  };
};
