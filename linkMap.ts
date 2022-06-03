export default {
  banner: {
    methods: ["PUT", "POST", "DELETE"],
    params: ["banner"],
  },
  banners: {
    methods: ["GET"],
  },
  block: {
    methods: ["GET", "POST", "PUT", "DELETE"],
    openMethods: ["GET"],
    params: ["block"],
  },
  blockContent: {
    methods: ["GET", "POST", "PUT", "DELETE"],
    params: ["blockContent"],
  },
  blockContext: {
    methods: ["GET", "POST", "PUT", "DELETE"],
    params: ["blockContext"],
  },
  blocks: {
    methods: ["GET"],
  },
  contextLinks: {
    methods: ["GET"],
    openMethods: ["GET"],
  },
  comment: {
    methods: ["PUT", "POST", "DELETE"],
    openMethods: ["POST"],
    params: ["comment"],
  },
  comments: {
    methods: ["GET"],
    openMethods: ["GET"],
    params: ["entry"],
  },
  drafts: {
    methods: ["GET"],
  },
  entries: {
    methods: ["GET"],
    openMethods: ["GET"],
  },
  entry: {
    methods: ["GET", "PUT", "POST", "DELETE"],
    openMethods: ["GET"],
    params: ["entry"],
  },
  filter: {
    methods: ["GET", "PUT", "POST", "DELETE"],
    openMethods: ["GET"],
    params: ["filter"],
  },
  filterRule: {
    methods: ["PUT", "POST", "DELETE"],
    params: ["filterRule"],
  },
  filters: {
    methods: ["GET"],
    openMethods: ["GET"],
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
    params: ["role"],
  },
  roleRight: {
    methods: ["POST", "DELETE"],
    params: ["role", "roleRight"],
  },
  roleRights: {
    methods: ["GET"],
  },
  roles: {
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
    openMethods: ["GET"],
  },
  token: {
    methods: ["PUT", "POST", "DELETE"],
    params: ["token"],
  },
  tokens: {
    methods: ["GET"],
  },
  uploadImage: {
    methods: ["POST"],
    openMethods: ["POST"],
    params: ["imageType"],
  },
  useToken: {
    methods: ["POST"],
    openMethods: ["POST"],
  },
};
