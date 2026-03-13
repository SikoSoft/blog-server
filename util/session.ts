import { HttpRequest } from "@azure/functions";
import { getSettings, getRoleRights } from "./config";
import { getConnection } from "./database";
import { state } from "./state";
import { Identity } from "@ss/identity";

export const getIp = (req: HttpRequest): string => {
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].replace(/:[0-9]+/, "")
    : "0.0.0.0";
};

export async function getSessionRole(sessToken: string = ""): Promise<number> {
  console.log("Getting session role for token:", sessToken);
  if (state.session[sessToken] && state.session[sessToken].role) {
    console.log(
      "Session role found in state cache:",
      state.session[sessToken].role
    );
    return state.session[sessToken].role;
  }

  const hasRoleResult = await Identity.hasRole(sessToken, "blog-admin");
  console.log("Checking if user has blog-admin role:", hasRoleResult);
  const settings = await getSettings();

  let role = settings.role_guest;

  if (hasRoleResult.isOk && hasRoleResult.value) {
    console.log(
      "User has blog-admin role, granting admin access",
      settings.role_admin
    );
    role = settings.role_admin;
  }

  state.session[sessToken] = state.session[sessToken]
    ? { ...state.session[sessToken], role }
    : { role };

  return role;
}

export async function _getSessionRole(sessToken: string = ""): Promise<number> {
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

export async function getSessionRights(sessToken: string): Promise<string[]> {
  if (state.session[sessToken] && state.session[sessToken].rights) {
    return state.session[sessToken].rights;
  }

  return new Promise(async (resolve, reject) => {
    try {
      const rights = await getRoleRights();
      const role = await getSessionRole(sessToken);
      const sessionRights = rights
        .filter((right) => Number(role) === Number(right.role))
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
