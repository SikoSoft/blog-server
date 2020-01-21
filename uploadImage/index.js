const azureStorage = require("azure-storage");
const multipart = require("parse-multipart");
const { shortDate } = require("../util");
const intoStream = require("into-stream");

const blobService = azureStorage.createBlobService();
const containerName = "images";

const getBlobName = fileName => {
  return `${shortDate()}/${fileName}`;
};

async function writeBlobContent(blobName, stream, streamLength, contentType) {
  return new Promise((resolve, reject) => {
    blobService.createBlockBlobFromStream(
      containerName,
      blobName,
      stream,
      streamLength,
      {
        contentSettings: {
          contentType
        }
      },
      err => {
        if (err) {
          context.log("error encountered", err);
          reject(err);
        }
        resolve();
      }
    );
  });
}

module.exports = async function(context, req) {
  const boundary = multipart.getBoundary(req.headers["content-type"]);
  const parts = multipart.Parse(req.body, boundary);
  const blobName = getBlobName(parts[0].filename);
  const buffer = new Buffer(parts[0].data, "base64");
  const stream = intoStream(buffer);
  const streamLength = buffer.length;
  await writeBlobContent(blobName, stream, streamLength, parts[0].type).then(
    () => {
      context.res = {
        body: JSON.stringify({
          url: `${process.env.AZURE_STORAGE_URL}/${blobName}`
        })
      };
    }
  );
};
