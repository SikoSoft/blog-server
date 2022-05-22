import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { jsonReply } from "../util";

const azureStorage = require("azure-storage");
const multipart = require("parse-multipart");
const { shortDate } = require("../util");
const intoStream = require("into-stream");

const blobService = azureStorage.createBlobService();
const containerName = "images";

const getBlobName = (fileName) => {
  return `${shortDate()}/${fileName}`;
};

async function writeBlobContent(blobName, stream, streamLength, contentType) {
  return new Promise<void>((resolve, reject) => {
    blobService.createBlockBlobFromStream(
      containerName,
      blobName,
      stream,
      streamLength,
      {
        contentSettings: {
          contentType,
        },
      },
      (err) => {
        if (err) {
          console.log("error encountered", err);
          reject(err);
        }
        resolve();
      }
    );
  });
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  console.log("uploadImage is being called");
  const boundary = multipart.getBoundary(req.headers["content-type"]);
  const parts = multipart.Parse(req.body, boundary);
  let blobName = getBlobName(parts[0].filename);
  if (context.bindingData.type) {
    blobName = `${context.bindingData.type}/${parts[0].filename}`;
  }
  const buffer = new Buffer(parts[0].data, "base64");
  const stream = intoStream(buffer);
  const streamLength = buffer.length;
  await writeBlobContent(blobName, stream, streamLength, parts[0].type);
  jsonReply(context, {
    url: `${process.env.AZURE_STORAGE_URL}/${blobName}`,
  });
};

export default httpTrigger;
