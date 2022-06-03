import { BlogBlockContent } from "./BlogBlockContent";
import { BlogBlockContext } from "./BlogBlockContext";

export interface BlogBlock {
  id: number;
  name: string;
  created: number;
  last_edited: number;
  content?: [BlogBlockContent];
  context?: [BlogBlockContext];
}
