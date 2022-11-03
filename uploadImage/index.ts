import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { uploadImage } from "../util/image";
import { hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
const multipart = require("parse-multipart");
const { shortDate } = require("../util");

const getBlobName = (fileName) => {
  return `${shortDate()}/${fileName}`;
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  if (!(await hasLinkAccess(req, req.method, "uploadImage"))) {
    crudViolation(context);
    return;
  }
  const boundary = multipart.getBoundary(req.headers["content-type"]);
  const parts = multipart.Parse(req.body, boundary);
  let blobName = getBlobName(parts[0].filename);
  if (context.bindingData.type) {
    blobName = `${context.bindingData.type}/${parts[0].filename}`;
  }

  await uploadImage(
    blobName,
    Buffer.from(parts[0].data, "base64"),
    parts[0].type
  );

  jsonReply(context, {
    url: `${process.env.AZURE_STORAGE_URL}/images/${blobName}`,
  });
};

export default httpTrigger;
