import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const entries = require("../entries/");

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  req.headers.type = "draft";
  await entries(context, req);
};

export default httpTrigger;
