import { HttpRequest } from "@azure/functions";
import { BlogEntry } from "../interfaces/BlogEntry";
import { getSettings, getTagRoles } from "./config";
import { sanitizeTitle } from "./data";
import { getConnection } from "./database";
import { getLinks } from "./links";
import { getSessionRole } from "./session";
import { state } from "./state";

async function getEntriesTags() {
  if (state.entriesTags) {
    return Promise.resolve(state.entriesTags);
  }
  return new Promise(async (resolve) => {
    const connection = await getConnection();
    const tagRows = await connection
      .select("*")
      .from("entries_tags")
      .orderBy("entry_id", "tag");
    const entriesTags = {};
    tagRows.forEach((tagRow) => {
      entriesTags[tagRow.entry_id] = [
        ...(entriesTags[tagRow.entry_id] ? entriesTags[tagRow.entry_id] : []),
        tagRow.tag,
      ];
    });
    state.entriesTags = entriesTags;
    resolve(entriesTags);
  });
}

async function getFurtherReading(entryId: string) {
  const settings = await getSettings();
  if (settings.further_reading_min_tags === 0) {
    return [];
  }
  const furtherReading = [];
  const entriesTags = await getEntriesTags();
  Object.keys(entriesTags).forEach((id) => {
    const matches = entriesTags[id].filter((tag) =>
      typeof entriesTags[entryId] !== "undefined"
        ? entriesTags[entryId].indexOf(tag) !== -1
        : false
    );
    if (id !== entryId && matches.length >= settings.further_reading_min_tags) {
      furtherReading.push(id);
    }
  });
  return furtherReading;
}

export const getLastEntry = async (query: any): Promise<any> => {
  return new Promise(async (resolve): Promise<any> => {
    try {
      const entry = await query.orderBy("created", "asc").limit(1).first();
      resolve(entry?.id ? entry.id : "");
    } catch (error) {
      console.error(error);
    }
  });
};

export const getExcludedEntries = async (
  sessToken: string = ""
): Promise<any> => {
  if (state.excludedEntries && state.excludedEntries[sessToken]) {
    return Promise.resolve(state.excludedEntries[sessToken]);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const idRows = await connection.select("id").from("entries");
      const role = await getSessionRole(sessToken);
      const tagRoles = await getTagRoles();
      const entriesTags = await getEntriesTags();
      const allIds = idRows.map((idRow) => idRow.id);
      const excludedEntries = allIds.filter((id) => {
        if (entriesTags[id]) {
          let allowedForAllTags = true;
          entriesTags[id].forEach((entryTag) => {
            if (tagRoles[entryTag] && tagRoles[entryTag].indexOf(role) === -1) {
              allowedForAllTags = false;
            }
          });
          if (!allowedForAllTags) {
            return true;
          }
        }
        return false;
      });
      state.excludedEntries[sessToken] = excludedEntries;
      resolve(excludedEntries);
    } catch (error) {
      reject(error);
    }
  });
};

export const processEntry = async (
  req: HttpRequest,
  entry: BlogEntry
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tags = await getEntriesTags();
      const furtherReading = await getFurtherReading(entry.id);
      resolve({
        ...entry,
        furtherReading,
        tags: tags[entry.id] ? tags[entry.id] : [],
        links: [
          ...(await getLinks(req, ["entry", "comments"], entry.id)),
          ...(await getLinks(req, ["comment"])),
        ],
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const getId = async (title: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await getConnection();
      const id = sanitizeTitle(title);
      const qRes = await connection
        .select("id")
        .from("entries")
        .whereRaw("id REGEXP ?", [id]);
      resolve(qRes.length === 0 ? id : `${id}-${qRes.length + 1}`);
    } catch (error) {
      reject(error);
    }
  });
};
