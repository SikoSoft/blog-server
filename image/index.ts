import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { hasLinkAccess } from "../util/links";
import { crudViolation, jsonReply } from "../util/reply";
import {
  containerName,
  generateImageVersion,
  getImageVersions,
  getNearestImageTargetWidth,
  getOriginalImageWidth,
  getSourceImage,
  getVersionFileName,
  imageVersionExists,
  SourceImage,
} from "../util/image";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "image"))) {
    crudViolation(context);
    return;
  }

  const { file: rawFile, width } = req.query;
  const file = rawFile.replace(`/${containerName}/`, "");

  const targetWidth = await getNearestImageTargetWidth(
    width ? parseInt(width) : 0
  );

  const exists = await imageVersionExists(file, targetWidth);
  const originalWidth = await getOriginalImageWidth(file);

  let versionFile: string;

  if (originalWidth <= targetWidth) {
    versionFile = file;
  } else {
    versionFile = await getVersionFileName(file, targetWidth);

    if (!exists) {
      let source: SourceImage;
      source = await getSourceImage(file);
      if (targetWidth < source.width) {
        await generateImageVersion(file, targetWidth);
      } else if (source.width) {
        versionFile = await getVersionFileName(file, source.width);
        const originalExists = await imageVersionExists(file, source.width);
        if (!originalExists) {
          await generateImageVersion(file, source.width);
        }
      } else {
        console.error("doesnt exist");
      }
    }
  }

  const url = new URL(
    [containerName, versionFile].join("/"),
    process.env.AZURE_STORAGE_URL
  );

  //jsonReply(context, { url: url.toString() });

  context.res = {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  };
};

export default httpTrigger;
