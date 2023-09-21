import { BlogRole } from "./BlogRole";
import { BlogSession } from "./BlogSession";
import { BlogImage } from "./BlogImage";
import { BlogSettings } from "./BlogSettings";
import { BlogRight } from "./BlogRight";
import { BlogImageSize } from "./BlogImageSize";

export interface BlogState {
  roles: BlogRole[];
  session: Record<string, BlogSession>;
  excludedEntries: Record<string, string[]>;
  imageVersions: Record<string, BlogImage[]>;
  entriesTags?: Record<string, string[]>;
  settings?: BlogSettings;
  tagRoles?: Record<string, number[]>;
  rights?: BlogRight[];
  imageSizes?: BlogImageSize[];
}
