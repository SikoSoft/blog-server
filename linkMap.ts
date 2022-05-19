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
  },
  roleRights: {
    methods: ["GET"],
  },
  setting: {
    methods: ["PUT"],
  },
  settings: {
    methods: ["GET"],
  },
  tagRole: {
    methods: ["POST", "DELETE"],
  },
  tagRoles: {
    methods: ["GET"],
  },
  tags: {
    methods: ["GET"],
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
