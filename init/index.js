const { baseUrl } = require("../util");

module.exports = async function(context, req) {
  const api = baseUrl(req.originalUrl);
  console.log("baseUrl", api);
  context.res = {
    status: 200,
    body: JSON.stringify({
      user: {
        role: 1
      },
      roles: [
        { id: 0, name: "guest", rights: ["r"] },
        { id: 1, name: "admin", rights: ["c", "r", "u", "d"] }
      ],
      api: {
        getEntries: `${api}/entries`,
        getEntriesByTag: `${api}/tags/{tag}`,
        getTags: `${api}/tags`
      }
    })
  };
};
