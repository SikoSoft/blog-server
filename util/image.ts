import azureStorage from "azure-storage";
import intoStream from "into-stream";
import MemoryStream from "memorystream";
import sharp from "sharp";
import fileType from "file-type";
import { BlogImage } from "../interfaces/BlogImage";
import { BlogImageSize } from "../interfaces/BlogImageSize";
import { getImageSizes } from "./config";
import { stream2buffer } from "./data";
import { getConnection } from "./database";
import { state } from "./state";

const blobService = azureStorage.createBlobService();
export const containerName = "images";

declare interface SourceImage extends BlogImageSize {
  buffer: Buffer;
  contentType: string;
}

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
  console.log("addImageVersion", file, width, height, original);
  const connection = await getConnection();
  await connection("images").insert({ file, width, height, original });
  //state.imageVersions[file] = state.imageVersions[file];
};

export const getSourceImage = async (file: string): Promise<SourceImage> => {
  return new Promise((resolve, reject) => {
    const stream = new MemoryStream();
    blobService.getBlobToStream(containerName, file, stream, async (err) => {
      if (err) {
        console.error("Encountered error getting blob as stream: ", err);
        reject();
      } else {
        stream.end();
        const buffer = await stream2buffer(stream);
        const metaData = await sharp(buffer).metadata();
        const { width, height } = metaData;
        const contentType = await (await fileType.fromBuffer(buffer)).mime;
        resolve({ buffer, width, height, contentType });
      }
    });
  });
};

export async function uploadImage(
  file: string,
  buffer: Buffer,
  contentType: string
) {
  const stream = intoStream(buffer);
  const streamLength = buffer.length;
  return new Promise<void>((resolve, reject) => {
    blobService.createBlockBlobFromStream(
      containerName,
      file,
      stream,
      streamLength,
      {
        contentSettings: {
          contentType,
        },
      },
      (error) => {
        if (error) {
          console.error("error encountered", error);
          reject(error);
        }
        resolve();
      }
    );
  });
}

export const generateImageVersions = async (file: string) => {
  const imageSizes = await getImageSizes();
  let source: SourceImage;

  try {
    source = await getSourceImage(file);
    console.log("SOURCE", source);
    await addImageVersion(file, source.width, source.height, 1);
    imageSizes.forEach(async (size) => {
      const width: number =
        size.width === 0
          ? Math.floor((size.height / source.height) * source.width)
          : size.width;
      const height: number =
        size.height === 0
          ? Math.floor((size.width / source.width) * source.height)
          : size.height;
      if (width < source.width) {
        console.log("CONTENT TYPE", source.contentType);
        const resized = await sharp(source.buffer)
          .resize({ width, height, fit: sharp.fit.fill })
          .toBuffer();
        const fileParts = file.split("/");
        fileParts.splice(fileParts.length - 1, 0, `${width}`);
        const newFile = fileParts.join("/");
        await uploadImage(newFile, resized, source.contentType);
        await addImageVersion(file, width, height, 0);
      }
    });
  } catch (error) {
    console.error(`Encountered error from getSourceImage(${file}): ${error}`);
  }

  console.log("generateImageVersion", file, imageSizes);
};
