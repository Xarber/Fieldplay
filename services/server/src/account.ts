// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createUserClient } from "@xcenter-id/client";
import { createXCenterOIDC, type LoginTransaction } from "@xcenter-id/server";

const sessionCookie = "fieldplay_account";
const loginCookie = "fieldplay_login";
const randomId = () => randomBytes(32).toString("base64url");

function cookie(req: IncomingMessage, key: string) {
  return req.headers.cookie
    ?.split(/;\s*/)
    .find((part) => part.startsWith(key + "="))
    ?.slice(key.length + 1);
}

function setCookie(
  res: ServerResponse,
  key: string,
  value: string,
  seconds: number,
) {
  res.appendHeader(
    "Set-Cookie",
    `${key}=${value}; Path=/account; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`,
  );
}

export function createAccountHandler(config: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const callback = new URL(config.redirectUri);
  if (
    callback.protocol !== "https:" ||
    callback.pathname !== "/account/callback" ||
    callback.search ||
    callback.hash
  )
    throw new Error("Fieldplay requires an exact HTTPS /account/callback URL");

  let oidc: ReturnType<typeof createXCenterOIDC> | undefined;
  const provider = () =>
    (oidc ??= createXCenterOIDC({
      ...config,
      file: false,
      scopes: ["openid", "profile", "friends", "app_data"],
    }).catch((error) => {
      oidc = undefined;
      throw error;
    }));

  const logins = new Map<string, LoginTransaction>();
  const sessions = new Map<
    string,
    {
      profile: { name?: string; preferred_username?: string };
      token: string;
      expiresAt: number;
    }
  >();

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url?.startsWith("/account/")) return false;
    const url = new URL(callback.origin + req.url);
    if (!url.pathname.startsWith("/account/")) return false;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const json = (status: number, body: object) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const redirect = (location: string) => {
      res.writeHead(303, { Location: location });
      res.end();
    };
    const now = Date.now();
    for (const [id, entry] of logins)
      if (entry.expiresAt <= now) logins.delete(id);
    for (const [id, entry] of sessions)
      if (entry.expiresAt <= now) sessions.delete(id);
    const sessionId = cookie(req, sessionCookie) ?? "";
    const session = sessions.get(sessionId);

    try {
      switch (`${req.method} ${url.pathname}`) {
        case "GET /account/login": {
          if (logins.size >= 256) {
            json(503, { error: "Sign-in is busy" });
            break;
          }
          const { url: authorization, transaction } = await (
            await provider()
          ).begin();
          if (logins.size >= 256) {
            json(503, { error: "Sign-in is busy" });
            break;
          }
          logins.delete(cookie(req, loginCookie) ?? "");
          const id = randomId();
          logins.set(id, transaction);
          setCookie(res, loginCookie, id, 300);
          redirect(authorization.href);
          break;
        }
        case "GET /account/callback": {
          const id = cookie(req, loginCookie) ?? "";
          const transaction = logins.get(id);
          logins.delete(id);
          setCookie(res, loginCookie, "", 0);
          if (!transaction || sessions.size >= 2048) {
            json(400, { error: "Start sign-in again" });
            break;
          }
          const { tokens, identity } = await (
            await provider()
          ).complete(url, transaction);
          if (sessions.size >= 2048) {
            json(503, { error: "Sign-in is busy" });
            break;
          }
          const { name, preferred_username } = identity;
          const seconds = Math.min(tokens.expires_in ?? 300, 3600);
          const newId = randomId();
          sessions.delete(sessionId);
          sessions.set(newId, {
            profile: { name, preferred_username },
            token: tokens.access_token,
            expiresAt: Date.now() + seconds * 1000,
          });
          setCookie(res, sessionCookie, newId, seconds);
          redirect("/#app");
          break;
        }
        case "GET /account/session":
          json(200, { profile: session?.profile ?? null });
          break;
        case "GET /account/friends": {
          if (!session) {
            json(401, { error: "Sign in to see friends" });
            break;
          }
          const user = createUserClient({
            clientId: config.clientId,
            getAccessToken: () => session.token,
          });
          const { friends } = await user.friends();
          json(200, { friends: friends.map(({ username }) => ({ username })) });
          break;
        }
        case "POST /account/logout":
          if (req.headers.origin !== callback.origin) {
            json(403, { error: "Invalid origin" });
            break;
          }
          sessions.delete(sessionId);
          setCookie(res, sessionCookie, "", 0);
          json(200, { profile: null });
          break;
        default:
          json(404, { error: "Account route not found" });
      }
    } catch (error) {
      if (
        url.pathname === "/account/friends" &&
        typeof error === "object" &&
        error &&
        "status" in error &&
        (error.status === 401 || error.status === 403)
      ) {
        json(error.status, {
          error:
            "Friends access is unavailable. Check your X-Center ID permissions.",
        });
        return true;
      }
      json(url.pathname === "/account/callback" ? 400 : 502, {
        error: "X-Center ID sign-in could not be completed",
      });
    }
    return true;
  };
}
