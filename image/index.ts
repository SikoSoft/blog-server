import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { hasLinkAccess } from "../util/links";
import { crudViolation } from "../util/reply";
import {
  addImageVersion,
  containerName,
  getImageVersions,
  getOriginalImageSize,
} from "../util/image";
import { BlogImageSize } from "../interfaces/BlogImageSize";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!(await hasLinkAccess(req, req.method, "image"))) {
    crudViolation(context);
    return;
  }

  const { file } = req.query;
  const versions = await getImageVersions(file);
  if (versions.length === 0) {
    let original: BlogImageSize;
    try {
      original = await getOriginalImageSize(
        req.query.file.replace(`/${containerName}/`, "")
      );
      const { width, height } = original;
      addImageVersion(file, width, height, 1);
    } catch (error) {
      console.log(
        `Error encountered while trying to retrieve image meta data for ${file}`
      );
    }
  }
  context.res = {
    body: JSON.stringify({
      url: "test",
      images: versions,
    }),
  };
  /*
  context.res = {
    status: 302,
    headers: {
      Location: `${process.env.AZURE_STORAGE_URL}${req.query.file}`,
    },
  };
  */
};

export default httpTrigger;
