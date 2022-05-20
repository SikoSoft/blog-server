export default {
  comment: {
    methods: ["PUT", "POST", "DELETE"],
    params: ["comment"],
  },
  comments: {
    methods: ["GET"],
    params: ["entry"],
  },
  draft: {
    methods: ["GET"],
  },
  drafts: {
    methods: ["GET"],
  },
  entries: {
    methods: ["GET"],
  },
  entry: {
    methods: ["GET", "PUT", "POST", "DELETE"],
    params: ["entry"],
  },
  filter: {
    methods: ["GET", "PUT", "POST", "DELETE"],
  },
  filters: {
    methods: ["GET"],
  },
  filterOrder: {
    methods: ["PUT"],
  },
  imageSize: {
    methods: ["PUT", "POST", "DELETE"],
  },
  imageSizes: {
    methods: ["GET"],
  },
  role: {
    methods: ["PUT", "POST", "DELETE"],
  },
  roleRight: {
    methods: ["POST", "DELETE"],
    params: ["role", "roleRight"],
  },
  roleRights: {
    methods: ["GET"],
  },
  setting: {
    methods: ["PUT"],
    params: ["setting"],
  },
  settings: {
    methods: ["GET"],
  },
  tagRole: {
    methods: ["POST", "DELETE"],
    params: ["tag", "tagRole"],
  },
  tagRoles: {
    methods: ["GET"],
  },
  tags: {
    methods: ["GET"],
    params: ["tags"],
  },
  token: {
    methods: ["PUT", "POST", "DELETE"],
  },
  tokens: {
    methods: ["GET"],
  },
  uploadImage: {
    methods: ["POST"],
  },
  useToken: {
    methods: ["POST"],
  },
};
