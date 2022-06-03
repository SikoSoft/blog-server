import { HttpRequest } from "@azure/functions";
import { getSettings, getRoleRights } from "./config";
import { getConnection } from "./database";
import { state } from "./state";

export const getIp = (req: HttpRequest): string => {
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].replace(/:[0-9]+/, "")
    : "0.0.0.0";
};

export async function getSessionRole(sessToken: string = "") {
  if (state.session[sessToken] && state.session[sessToken].role) {
    return Promise.resolve(state.session[sessToken].role);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const settings = await getSettings();
      if (!sessToken) {
        resolve(settings.role_guest);
        return;
      }
      let role = settings.role_guest;
      const connection = await getConnection();
      const [session] = await connection
        .select("*")
        .from("tokens_consumed")
        .join("tokens", "tokens.code", "=", "tokens_consumed.code")
        .where("tokens_consumed.session", sessToken);

      if (session) {
        role = session.role;
      }
      state.session[sessToken] = state.session[sessToken]
        ? { ...state.session[sessToken], role }
        : { role };
      resolve(role);
    } catch (error) {
      reject(error);
    }
  });
}

export async function getSessionRights(sessToken) {
  if (state.session[sessToken] && state.session[sessToken].rights) {
    return Promise.resolve(state.session[sessToken].rights);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const rights = await getRoleRights();
      const role = await getSessionRole(sessToken);
      const sessionRights = rights
        .filter((right) => role === right.role)
        .map((right) => right.action);
      state.session[sessToken] = state.session[sessToken]
        ? { ...state.session[sessToken], rights: sessionRights }
        : { rights: sessionRights };
      resolve(sessionRights);
    } catch (error) {
      reject(error);
    }
  });
}
