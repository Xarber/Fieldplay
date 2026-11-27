// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import test from "node:test";
import { createAccountHandler } from "../services/server/src/account";
import { makeServer } from "../services/server/src/server";

test("guest service and account routes enforce session and callback boundaries", async () => {
  const server = makeServer({
    port: 0,
    accountHandler: createAccountHandler({
      clientId: "test",
      clientSecret: "test",
      redirectUri: "https://fieldplay.example/api/account/callback",
    }),
  });
  const port = await server.listen();
  try {
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(base + "/health")).status, 200);
    const session = await fetch(base + "/api/account/session");
    assert.equal(session.headers.get("cache-control"), "no-store");
    assert.deepEqual(await session.json(), { profile: null });
    assert.equal((await fetch(base + "/api/account/friends")).status, 401);
    assert.equal((await fetch(base + "/api/account/callback")).status, 400);
    assert.equal(
      (await fetch(base + "/api/account/logout", { method: "POST" })).status,
      403,
    );
    const logout = await fetch(base + "/api/account/logout", {
      method: "POST",
      headers: { origin: "https://fieldplay.example" },
    });
    assert.equal(logout.status, 200);
    assert.match(
      logout.headers.get("set-cookie") ?? "",
      /Max-Age=0; HttpOnly; Secure; SameSite=Lax/,
    );
  } finally {
    await server.close();
  }
});
