// SPDX-License-Identifier: AGPL-3.0-only
import { WebSocket } from "ws";
import { GameClient } from "@fieldplay/transport";
import type { View } from "@fieldplay/engine";
import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://127.0.0.1:18787";
const expected = process.argv[3];
const health = (await fetch(`${base}/health`).then((r) => r.json())) as {
  ok: boolean;
  commit: string;
};
assert.equal(health.ok, true);
if (expected) assert.equal(health.commit, expected);
for (const path of ["/", "/welcome/", "/manifest.webmanifest", "/sw.js"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `Missing ${path}`);
}
let av: View | undefined, bv: View | undefined;
const errors: string[] = [];
const factory = {
  socket: (u: string) => new WebSocket(u) as unknown as globalThis.WebSocket,
};
const a = new GameClient(
    {
      onView: (v) => (av = v),
      onStatus: () => {},
      onError: (m) => errors.push(m),
    },
    factory,
  ),
  b = new GameClient(
    {
      onView: (v) => (bv = v),
      onStatus: () => {},
      onError: (m) => errors.push(m),
    },
    factory,
  );
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Deployed handshake timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}
try {
  const ws = base.replace(/^http/, "ws");
  await a.connect(ws, {
    operation: "create",
    name: "Private smoke host",
    partyName: "Deployment smoke — no GPS",
    authority: "dedicated",
  });
  await until(() => !!av);
  a.send({ type: "configure", config: { ...av!.config, mode: "manhunt" } });
  await until(() => av!.config.mode === "manhunt");
  await b.connect(ws, {
    operation: "join",
    name: "Private smoke guest",
    code: a.credentials!.code,
  });
  await until(() => bv?.players.length === 2);
  a.send({ type: "chat", text: "Private deployment handshake" });
  await until(() => bv!.chat.length === 1);
  for (const c of [a, b]) {
    c.send({ type: "consent", accepted: true });
    c.send({ type: "ready", ready: true });
  }
  await until(() => av!.players.every((p) => p.ready));
  a.send({ type: "start" });
  await until(() => bv!.phase === "active");
  b.send({ type: "pause" });
  await until(() => av!.phase === "paused");
  a.send({ type: "end" });
  await until(() => av!.phase === "finished" && bv!.phase === "finished");
  assert.ok(av!.players.every((p) => !p.consent && !p.location));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        commit: health.commit,
        checks: [
          "served app and landing",
          "PWA assets",
          "authenticated two-client handshake",
          "chat synchronization",
          "ready/start",
          "guest safety pause",
          "host end and sharing cleanup",
        ],
        gps: "No location collected or sent",
      },
      null,
      2,
    ),
  );
} finally {
  a.close();
  b.close();
}
