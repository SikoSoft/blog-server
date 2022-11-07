import { BlogLink } from "./BlogLink";

export interface BlogRole {
  id: number;
  name: string;
  links?: BlogLink[];
}
