// End-to-end rule/transport tests with real sockets and real 60-second authority timers.
// GPS samples are synthetic fixtures in ephemeral test-only rooms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { GameClient } from "@fieldplay/transport";
import { defaultConfig, offset, type View, type Mode } from "@fieldplay/engine";
import { makeServer } from "../services/server/src/server";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(check: () => boolean, timeout = 5000) {
  const end = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > end)
      throw new Error("Timed out waiting for synchronized state");
    await sleep(20);
  }
}
test(
  "Manhunt, Domination and Smugglers complete over real multiplayer sockets",
  { timeout: 85000 },
  async () => {
    await Promise.all(
      (["manhunt", "domination", "smugglers"] as const).map(async (mode) => {
        const server = makeServer({ port: 0 });
        const port = await server.listen();
        let av: View | undefined, bv: View | undefined;
        const errors: string[] = [];
        const options = {
          socket: (url: string) =>
            new WebSocket(url) as unknown as globalThis.WebSocket,
        };
        const a = new GameClient(
            {
              onView: (v) => (av = v),
              onStatus: () => {},
              onError: (m) => errors.push(m),
            },
            options,
          ),
          b = new GameClient(
            {
              onView: (v) => (bv = v),
              onStatus: () => {},
              onError: (m) => errors.push(m),
            },
            options,
          );
        try {
          await a.connect(`ws://localhost:${port}`, {
            operation: "create",
            name: "Violet player",
            authority: "dedicated",
          });
          await until(() => !!av);
          const center = av!.config.arena.center;
          const config = {
            ...defaultConfig(center),
            mode,
            duration: 60,
            checkpoints:
              mode === "domination"
                ? [center]
                : mode === "smugglers"
                  ? [center, offset(center, 60, 1)]
                  : [],
          };
          a.send({ type: "configure", config });
          await until(() => av!.config.mode === mode);
          await b.connect(`ws://localhost:${port}`, {
            operation: "join",
            name: "Lime player",
            code: a.credentials!.code,
          });
          await until(() => av!.players.length === 2 && !!bv);
          const locate = (c: GameClient, point = center) =>
            c.send({
              type: "location",
              sample: {
                ...point,
                accuracy: 2,
                timestamp: Date.now(),
                provenance: "measured",
              },
            });
          for (const c of [a, b]) {
            c.send({ type: "consent", accepted: true });
            locate(c);
            c.send({ type: "ready", ready: true });
          }
          await until(() => av!.players.every((p) => p.ready));
          a.send({ type: "start" });
          await until(() => bv!.phase === "active");
          if (mode === "manhunt") {
            a.send({ type: "capture", target: b.credentials!.id });
            await until(() => !!bv!.interactions.length);
            b.send({ type: "confirm", interactionId: bv!.interactions[0].id });
            await until(
              () => av!.phase === "finished" && bv!.phase === "finished",
            );
            assert.equal(av!.winner, "Hunters");
          }
          if (mode === "smugglers") {
            b.send({ type: "pickup" });
            await until(
              () =>
                !!bv!.players.find((p) => p.id === b.credentials!.id)?.cargo,
            );
            await sleep(6000);
            locate(b, config.checkpoints[1]);
            b.send({ type: "deliver" });
            await until(() => av!.teamScores.lime === 100);
            await until(
              () => av!.phase === "finished" && bv!.phase === "finished",
              65000,
            );
            assert.equal(av!.winner, "Lime team");
          }
          if (mode === "domination") {
            await sleep(6000);
            locate(b, offset(center, 65, 0));
            locate(a);
            await sleep(5000);
            locate(a);
            a.send({ type: "claim", checkpoint: 0 });
            await until(() => av!.checkpoints[0].progress === 25);
            for (let i = 0; i < 3; i++) {
              await sleep(5100);
              locate(a);
              a.send({ type: "claim", checkpoint: 0 });
              await until(() => av!.checkpoints[0].progress === (i + 2) * 25);
            }
            await until(
              () => av!.phase === "finished" && bv!.phase === "finished",
              45000,
            );
            assert.equal(av!.winner, "Violet team");
            assert.ok(av!.teamScores.violet > 0);
          }
          assert.equal(av!.winner, bv!.winner);
          assert.deepEqual(av!.teamScores, bv!.teamScores);
          assert.equal(av!.results.length, 1);
          assert.ok(av!.players.every((p) => !p.consent && !p.location));
          assert.deepEqual(errors, []);
        } finally {
          a.close();
          b.close();
          await server.close();
        }
      }),
    );
  },
);
