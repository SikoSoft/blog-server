import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import {
  containerName,
  generateImageVersion,
  getNearestImageConfigSize,
  getVersionFileName,
  imageVersionExists,
} from "../util/image";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "image"))) {
    crudViolation(context);
    return;
  }

  const { file: rawFile, width, height } = req.query;
  const file = rawFile.replace(`/${containerName}/`, "");

  try {
    const size = await getNearestImageConfigSize(file, {
      width: width ? parseInt(width) : 0,
      height: height ? parseInt(height) : 0,
    });

    const exists = await imageVersionExists(file, size);
    const versionFile = await getVersionFileName(file, size);

    if (!exists) {
      await generateImageVersion(file, size);
    }

    const url = new URL(
      [containerName, versionFile].join("/"),
      process.env.AZURE_STORAGE_URL
    );

    context.res = {
      status: 302,
      headers: {
        Location: url.toString(),
      },
    };
  } catch (error) {
    console.log(
      `Error encountered while trying to get image ${file}: ${JSON.stringify(
        error
      )}`
    );
    jsonReply(context, { test: " " }, 400);
  }
};

export default httpTrigger;
