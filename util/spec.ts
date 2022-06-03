import spec = require("blog-spec");

export function contextIsValid(id: string): boolean {
  return spec.contexts.filter((context) => id === context.id).length > 0;
}
