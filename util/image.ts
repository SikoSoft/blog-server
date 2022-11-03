import azureStorage from "azure-storage";
import MemoryStream from "memorystream";
import sharp from "sharp";
import { BlogImage } from "../interfaces/BlogImage";
import { BlogImageSize } from "../interfaces/BlogImageSize";
import { stream2buffer } from "./data";
import { getConnection } from "./database";
import { state } from "./state";

const blobService = azureStorage.createBlobService();
export const containerName = "images";

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
  //state.imageVersions[file] = state.imageVersions[file];
};

export const getOriginalImageSize = async (
  blobName: string
): Promise<BlogImageSize> => {
  return new Promise((resolve, reject) => {
    const stream = new MemoryStream();
    blobService.getBlobToStream(
      containerName,
      blobName,
      stream,
      async (err) => {
        if (err) {
          console.error("Encountered error getting blob as stream: ", err);
          reject();
        } else {
          stream.end();
          const buffer = await stream2buffer(stream);
          const metaData = await sharp(buffer).metadata();
          const { width, height } = metaData;
          resolve({ width, height });
        }
      }
    );
  });
};
