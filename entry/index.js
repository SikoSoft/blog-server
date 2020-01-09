module.exports = async function(context, req) {
  context.res = {
    status: 200,
    body: JSON.stringify({ id: "2019-08-04/testing-123" })
  };
};
