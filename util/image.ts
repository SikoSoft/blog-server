import "dotenv/config";
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import intoStream from "into-stream";
import sharp from "sharp";
import fileType from "file-type";
import { BlogImage } from "../interfaces/BlogImage";
import { BlogImageSize } from "../interfaces/BlogImageSize";
import { getImageSizes } from "./config";
import { getConnection } from "./database";
import { state } from "./state";
import { Context } from "@azure/functions";

const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

export const containerName = "images";

export interface SourceImage extends BlogImageSize {
  buffer: Buffer;
  contentType: string;
}

const sourceImages: Record<string, SourceImage> = {};

export const getImageVersions = async (file: string): Promise<BlogImage[]> => {
  if (state.imageVersions?.[file]) {
    return state.imageVersions[file];
  }

  const connection = await getConnection();

  const images: BlogImage[] = await connection
    .select("*")
    .from("images")
    .where("file", file);

  state.imageVersions[file] = images;

  return images;
};

export const addImageVersion = async (
  file: string,
  width: number,
  height: number,
  original: number
): Promise<void> => {
  const connection = await getConnection();
  await connection("images").insert({ file, width, height, original });
  delete state.imageVersions[file];
};

export const getSourceImage = async (file: string): Promise<SourceImage> => {
  if (sourceImages[file]) {
    return Promise.resolve(sourceImages[file]);
  }

  return new Promise(async (resolve, reject) => {
    const blobClient = getBlobClient(file);
    const response = await blobClient.downloadToBuffer();

    if (response) {
      const buffer = response;
      const metaData = await sharp(buffer).metadata();
      const { width, height } = metaData;
      const contentType = await (await fileType.fromBuffer(buffer)).mime;
      const source = { buffer, width, height, contentType };
      sourceImages[file] = source;
      return resolve(source);
    } else {
      reject();
    }
  });
};

export async function uploadImage(
  file: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const stream = intoStream(buffer);
  const streamLength = buffer.length;
  return new Promise<void>(async (resolve, reject) => {
    const blobClient = getBlobClient(file);

    const response = await blobClient.uploadStream(stream, streamLength, 5, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    if (response.errorCode) {
      reject(response.errorCode);
    } else {
      resolve();
    }
  });
}

export async function generateImageVersion(
  context: Context,
  file: string,
  width: number
) {
  try {
    const source = await getSourceImage(file);
    const height: number = Math.floor((width / source.width) * source.height);
    if (width < source.width) {
      const resized = await sharp(source.buffer)
        .resize({ width, height, fit: sharp.fit.fill })
        .toBuffer();
      const newFile = await getVersionFileName(file, width);
      await uploadImage(newFile, resized, source.contentType);
      await addImageVersion(file, width, height, 0);
    } else if (width === source.width) {
      await addImageVersion(file, source.width, source.height, 1);
    }
  } catch (error) {
    context.log(`ERROR generating image version: ${file} | ${width}, ${error}`);
  }
}

export async function getNearestImageTargetWidth(
  width: number
): Promise<number> {
  let targetWidth: number = 0;
  const sizes = await getImageSizes();
  sizes.some((size: BlogImageSize) => {
    if (width && width >= size.width) {
      targetWidth = size.width;
      return false;
    }
  });

  return targetWidth;
}

export async function imageVersionExists(
  file: string,
  width: number
): Promise<boolean> {
  return (await getImageVersions(file)).some(
    (version) => version.width === width
  );
}

export async function getOriginalImageWidth(file: string): Promise<number> {
  const filtered = (await getImageVersions(file)).filter(
    (version) => version.original === 1
  );
  return filtered.length ? filtered[0].width : 0;
}

export async function getVersionFileName(
  file: string,
  width: number
): Promise<string> {
  const fileParts = file.split("/");
  const source = await getSourceImage(file);
  if (source.width !== width) {
    fileParts.splice(fileParts.length - 1, 0, `${width}`);
  }
  return fileParts.join("/");
}

export function getBlobClient(file: string): BlockBlobClient {
  return blobService.getContainerClient(containerName).getBlockBlobClient(file);
}
