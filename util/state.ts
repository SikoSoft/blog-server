const initialState = {
  roles: [],
  filtersRules: [],
  session: {},
  excludedEntries: {},
};

export let state = { ...JSON.parse(JSON.stringify(initialState)) };

export const flushState = (key?: string): void => {
  if (key) {
    delete state[key];
  } else {
    state = { ...JSON.parse(JSON.stringify(initialState)) };
  }
};
