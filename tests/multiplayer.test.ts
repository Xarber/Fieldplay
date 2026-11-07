// Real WebSocket clients; synthetic GPS, no physical-device/outdoor evidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { makeServer } from "../services/server/src/server";
import { GameClient } from "@fieldplay/transport";
import { uid, type View, type Command } from "@fieldplay/engine";
const wait = async (predicate: () => boolean, timeout = 5000) => {
  const end = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > end)
      throw new Error("Timed out waiting for multiplayer state.");
    await new Promise((r) => setTimeout(r, 10));
  }
};
test(
  "two actual WebSocket clients complete treasure match, synchronize scores/results and replay",
  { timeout: 15000 },
  async () => {
    const service = makeServer({ port: 0 });
    const port = await service.listen();
    const errors: string[] = [];
    let aView: View | undefined, bView: View | undefined;
    const a = new GameClient(
      {
        onView: (v) => (aView = v),
        onStatus: () => {},
        onError: (m) => errors.push(m),
      },
      { socket: (u) => new WebSocket(u) as unknown as globalThis.WebSocket },
    );
    const b = new GameClient(
      {
        onView: (v) => (bView = v),
        onStatus: () => {},
        onError: (m) => errors.push(m),
      },
      { socket: (u) => new WebSocket(u) as unknown as globalThis.WebSocket },
    );
    try {
      await a.connect(`ws://localhost:${port}`, {
        operation: "create",
        name: "Ada",
        authority: "dedicated",
      });
      await b.connect(`ws://localhost:${port}`, {
        operation: "join",
        name: "Bo",
        code: a.credentials!.code,
      });
      await wait(
        () => aView?.players.length === 2 && bView?.players.length === 2,
      );
      const center = aView!.config.arena.center;
      const sample = () => ({
        ...center,
        accuracy: 2,
        timestamp: Date.now(),
        provenance: "measured" as const,
      });
      for (const c of [a, b]) {
        c.send({ type: "consent", accepted: true });
        c.send({ type: "location", sample: sample() });
        c.send({
          type: "treasure",
          position: center,
          clue: c === a ? "Ada’s hidden clue" : "Bo’s hidden clue",
          kind: "qr",
        });
        c.send({ type: "ready", ready: true });
      }
      await wait(() => aView!.players.every((p) => p.ready));
      const aCode = aView!.ownTreasure!.code,
        bCode = bView!.ownTreasure!.code;
      a.send({ type: "start" });
      await wait(() => bView?.phase === "return");
      a.send({ type: "returned" });
      b.send({ type: "returned" });
      await wait(() => aView?.phase === "active" && bView?.phase === "active");
      assert.equal(aView!.assignment?.clue, "Bo’s hidden clue");
      assert.ok(!JSON.stringify(aView).includes(bCode));
      assert.equal(bView!.assignment?.clue, "Ada’s hidden clue");
      b.send({ type: "verify", code: aCode });
      await wait(
        () => aView?.phase === "finished" && bView?.phase === "finished",
      );
      assert.equal(aView!.winner, "Bo");
      assert.equal(
        aView!.players.find((p) => p.id === b.credentials!.id)?.score,
        bView!.players.find((p) => p.id === b.credentials!.id)?.score,
      );
      assert.ok(aView!.players.every((p) => !p.consent && !p.location));
      assert.equal(aView!.results.length, 1);
      a.send({ type: "replay" });
      await wait(() => bView?.phase === "lobby");
      assert.equal(bView!.ownTreasure, undefined);
      assert.equal(bView!.results.length, 1);
      assert.deepEqual(errors, []);
    } finally {
      a.close();
      b.close();
      await service.close();
    }
  },
);
test(
  "server rejects stale credentials, malformed commands and unauthorized host actions",
  { timeout: 10000 },
  async () => {
    const s = makeServer({ port: 0 });
    const port = await s.listen();
    const ws = new WebSocket(`ws://localhost:${port}`);
    const messages: any[] = [];
    ws.on("message", (r) => messages.push(JSON.parse(String(r))));
    await new Promise<void>((r) => ws.once("open", () => r()));
    ws.send(
      JSON.stringify({
        type: "hello",
        operation: "resume",
        name: "Intruder",
        code: uid(),
        token: uid(),
      }),
    );
    await wait(() => messages.length > 0);
    assert.equal(messages[0].type, "error");
    assert.match(messages[0].message, /invalid or expired/);
    ws.close();
    await s.close();
  },
);

test(
  "authenticated guests cannot reconfigure, spoof a score, or submit malformed GPS",
  { timeout: 10000 },
  async () => {
    const server = makeServer({ port: 0 });
    const port = await server.listen();
    const errors: string[] = [];
    let view: View | undefined;
    const factory = {
      socket: (url: string) =>
        new WebSocket(url) as unknown as globalThis.WebSocket,
    };
    const host = new GameClient(
        {
          onView: (v) => (view = v),
          onStatus: () => {},
          onError: (m) => errors.push(m),
        },
        factory,
      ),
      guest = new GameClient(
        {
          onView: () => {},
          onStatus: () => {},
          onError: (m) => errors.push(m),
        },
        factory,
      );
    try {
      await host.connect(`ws://localhost:${port}`, {
        operation: "create",
        name: "Host",
        authority: "dedicated",
      });
      await guest.connect(`ws://localhost:${port}`, {
        operation: "join",
        name: "Guest",
        code: host.credentials!.code,
      });
      await wait(() => view?.players.length === 2);
      const revision = view!.revision;
      guest.send({ type: "configure", config: view!.config });
      await wait(() => errors.some((e) => e.includes("host")));
      assert.equal(view!.revision, revision);
      // Deliberately bypass TypeScript to exercise wire validation against untrusted input.
      guest.send({ type: "score", points: 999 } as unknown as Command);
      await wait(() =>
        errors.some((e) => e.includes("Invalid message format")),
      );
      assert.ok(view!.players.every((p) => p.score === 0));
      const room = server.rooms.get(host.credentials!.code)!;
      room.members.get(guest.credentials!.id)!.expires = Date.now() - 1;
      guest.send({ type: "chat", text: "Expired session cannot write" });
      await wait(() => errors.some((e) => e.includes("Session expired")));
      assert.equal(view!.chat.length, 0);
    } finally {
      host.close();
      guest.close();
      await server.close();
    }
  },
);

test(
  "dedicated host disconnect pauses and authenticated resume preserves safe state",
  { timeout: 10000 },
  async () => {
    const server = makeServer({ port: 0 });
    const port = await server.listen();
    let hv: View | undefined, gv: View | undefined;
    const errors: string[] = [];
    const factory = {
      socket: (url: string) =>
        new WebSocket(url) as unknown as globalThis.WebSocket,
    };
    const host = new GameClient(
        {
          onView: (v) => (hv = v),
          onStatus: () => {},
          onError: (m) => errors.push(m),
        },
        factory,
      ),
      guest = new GameClient(
        {
          onView: (v) => (gv = v),
          onStatus: () => {},
          onError: (m) => errors.push(m),
        },
        factory,
      );
    try {
      await host.connect(`ws://localhost:${port}`, {
        operation: "create",
        name: "Host",
        authority: "dedicated",
      });
      await wait(() => !!hv);
      host.send({
        type: "configure",
        config: { ...hv!.config, mode: "manhunt" },
      });
      await wait(() => hv?.config.mode === "manhunt");
      await guest.connect(`ws://localhost:${port}`, {
        operation: "join",
        name: "Guest",
        code: host.credentials!.code,
      });
      await wait(() => gv?.players.length === 2);
      for (const client of [host, guest]) {
        client.send({ type: "consent", accepted: true });
        client.send({ type: "ready", ready: true });
      }
      await wait(() => hv!.players.every((p) => p.ready));
      host.send({ type: "start" });
      await wait(() => gv?.phase === "active");
      const credentials = { ...host.credentials! };
      host.close();
      await wait(() => gv?.phase === "paused");
      await host.connect(`ws://localhost:${port}`, {
        operation: "resume",
        name: "Host",
        code: credentials.code,
        token: credentials.token,
      });
      await wait(
        () => hv?.phase === "paused" && hv.players.every((p) => p.connected),
      );
      host.send({ type: "resume" });
      await wait(() => gv?.phase === "active");
      assert.deepEqual(errors, []);
    } finally {
      host.close();
      guest.close();
      await server.close();
    }
  },
);
