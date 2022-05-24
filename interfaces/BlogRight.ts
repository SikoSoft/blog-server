import { BlogEntityMethod } from "./BlogEntityMethod";

export interface BlogRight {
  id: string;
  defaultRoles: [number];
  crudDependencies?: [BlogEntityMethod];
}
