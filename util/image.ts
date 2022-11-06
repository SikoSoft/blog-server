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
};

export const getSourceImage = async (file: string): Promise<SourceImage> => {
  if (sourceImages[file]) {
    return Promise.resolve(sourceImages[file]);
  }

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
        const source = { buffer, width, height, contentType };
        sourceImages[file] = source;
        resolve(source);
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

export async function generateImageVersion(file: string, size: BlogImageSize) {
  const source = await getSourceImage(file);
  const width: number =
    size.width === 0
      ? Math.floor((size.height / source.height) * source.width)
      : size.width;
  const height: number =
    size.height === 0
      ? Math.floor((size.width / source.width) * source.height)
      : size.height;
  if (width < source.width) {
    const resized = await sharp(source.buffer)
      .resize({ width, height, fit: sharp.fit.fill })
      .toBuffer();
    const newFile = await getVersionFileName(file, size);
    await uploadImage(newFile, resized, source.contentType);
    await addImageVersion(file, width, height, 0);
  } else if (width === source.width) {
    await addImageVersion(file, source.width, source.height, 1);
  }
}

export async function generateImageVersions(file: string) {
  const imageSizes = await getImageSizes();
  let source: SourceImage;

  try {
    source = await getSourceImage(file);

    imageSizes.forEach(async (size) => {});
  } catch (error) {
    console.error(`Encountered error from getSourceImage(${file}): ${error}`);
  }
}

export async function getNearestImageConfigSize(
  file: string,
  configSize: BlogImageSize
): Promise<BlogImageSize> {
  let imageSize: BlogImageSize = { width: 0, height: 0 };
  try {
    const source = await getSourceImage(file);
    const sizes = await getImageSizes();
    sizes.some((size: BlogImageSize) => {
      const { width, height } = size;
      if (configSize.width && configSize.width >= width) {
        imageSize = { width, height };
        return false;
      } else if (configSize.height && configSize.height >= height) {
        imageSize = { width, height };
        return false;
      }
    });
    if (imageSize.width && !imageSize.height) {
      imageSize.height = Math.floor(
        (imageSize.width / source.width) * source.height
      );
    }
    if (imageSize.height && !imageSize.width) {
      imageSize.width = Math.floor(
        (imageSize.height / source.height) * source.width
      );
    }
  } catch (error) {
    console.error(
      `Encountered an error in getNearestImageSize: ${JSON.stringify(error)}`
    );
  }
  return imageSize;
}

export async function imageVersionExists(
  file: string,
  size: BlogImageSize
): Promise<boolean> {
  return (await getImageVersions(file)).some(
    (version) => version.width === size.width && version.height === size.height
  );
}

export async function getHeightFromWidth(file: string): Promise<number> {
  let height: number = 0;
  try {
    const source = await getSourceImage(file);
  } catch (error) {
    console.error(
      `Encountered an error in getHeightFromWidth: ${JSON.stringify(error)}`
    );
  }
  return height;
}

export async function getVersionFileName(
  file: string,
  size: BlogImageSize
): Promise<string> {
  const fileParts = file.split("/");
  const source = await getSourceImage(file);
  if (source.width !== size.width) {
    fileParts.splice(fileParts.length - 1, 0, `${size.width}`);
  }
  return fileParts.join("/");
}
