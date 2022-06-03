import { Context } from "@azure/functions";
import spec = require("blog-spec");

export const jsonReply = (
  context: Context,
  object: Object = {},
  status: number = 200
): void => {
  context.res = {
    status,
    headers: {
      "content-type": "application/json",
    },
    ...(Object.keys(object).length ? { body: JSON.stringify(object) } : {}),
  };
};

export const crudViolation = async (context: Context): Promise<void> => {
  jsonReply(context, { errorCode: spec.errorCodes.ERROR_CRUD_ACCESS });
};
