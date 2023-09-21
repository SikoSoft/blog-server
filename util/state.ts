import { BlogState } from "../interfaces/BlogState";

const initialState: BlogState = {
  roles: [],
  session: {},
  excludedEntries: {},
  imageVersions: {},
};

export let state: BlogState = { ...JSON.parse(JSON.stringify(initialState)) };

export const flushState = (key?: string): void => {
  if (key) {
    delete state[key];
  } else {
    state = { ...JSON.parse(JSON.stringify(initialState)) };
  }
};
