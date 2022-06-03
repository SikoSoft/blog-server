import { HttpRequest } from "@azure/functions";
import spec = require("blog-spec");
import { BlogEntityMethod } from "../interfaces/BlogEntityMethod";
import { BlogLink } from "../interfaces/BlogLink";
import { BlogRight } from "../interfaces/BlogRight";
import { arrayUnique } from "./data";
import linkMap from "./linkMap";
import { getSessionRights } from "./session";
import { contextIsValid } from "./spec";

export function baseUrl(req): string {
  const url = new URL(req.originalUrl);
  const pathDirs = url.pathname.split("/");
  return `${url.origin}${pathDirs
    .slice(0, pathDirs.length - Object.keys(req.params).length - 1)
    .join("/")}`;
}

export function getEndpoint(req: HttpRequest, endpoint: BlogLink): BlogLink {
  return {
    rel: endpoint.rel,
    entity: endpoint.entity,
    href: `${baseUrl(req)}/${endpoint.href}`,
    method: endpoint.method,
    key: req.headers.key ? req.headers.key : "",
  };
}

export async function getLinks(
  req: HttpRequest,
  entities: string | string[],
  id?: any | any[],
  rel?: any
): Promise<Array<BlogLink>> {
  const ids =
    typeof id === "undefined" ? [] : typeof id !== "object" ? [id] : id;
  return await arrayUnique(
    (
      await Promise.all(
        [...(typeof entities === "string" ? [entities] : entities)].map(
          async (entity) => {
            const links = [];
            if (linkMap[entity]) {
              const entityParams = linkMap[entity].params || [];
              let methods = linkMap[entity].methods;
              const isReferencingEntity =
                (ids.length &&
                  ids.length - 1 === entityParams.indexOf(entity)) ||
                false;
              const needsIdToGet =
                (entityParams.length &&
                  entityParams[entityParams.length - 1] === entity) ||
                false;
              if (isReferencingEntity) {
                methods = methods.filter((method) => method !== "POST");
              }
              if (needsIdToGet && !isReferencingEntity) {
                methods = methods.filter((method) => method !== "GET");
              }
              if (needsIdToGet && ids.length === 0) {
                methods = methods.filter((method) => method === "POST");
              }
              for (const method of methods) {
                if (await hasLinkAccess(req, method, entity)) {
                  links.push(
                    getEndpoint(req, {
                      entity,
                      href: `${entity}${id ? "/" + ids.join("/") : ""}`,
                      method,
                      rel,
                    })
                  );
                }
              }
            }
            return links;
          }
        )
      )
    ).reduce((prev, cur) => [...prev, ...cur], [])
  );
}

export async function hasLinkAccess(
  req: HttpRequest,
  method: string,
  entity: string
): Promise<boolean> {
  const rights = await getSessionRights(req.headers["sess-token"]);
  const isOpen = linkMap[entity]?.openMethods?.indexOf(method) > -1 || false;
  const rightsDependencies = spec.rights
    .filter((right: BlogRight) => rights.indexOf(right.id) > -1)
    .map((right: BlogRight) => right.crudDependencies || [])
    .reduce((prev, cur) => [...prev, ...cur], []);
  return (
    isOpen ||
    rightsDependencies.filter(
      (entityMethod: BlogEntityMethod) =>
        entityMethod.entity === entity && entityMethod.method === method
    )?.length > 0
  );
}

export async function getContextLinks(
  req: HttpRequest
): Promise<Array<BlogLink>> {
  const context = req.headers.context ? JSON.parse(req.headers.context) : [];
  return await arrayUnique(
    (
      await Promise.all(
        context
          .filter((context) => contextIsValid(context.id))
          .map(async (context) =>
            context?.props?.length
              ? await getLinks(
                  req,
                  context.props[0],
                  context.props[1],
                  context.id
                )
              : []
          )
      )
    ).reduce((prev, cur) => [...prev, ...cur], [])
  );
}
