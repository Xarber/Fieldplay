// Synthetic GPS fixtures in isolated in-memory matches. No outdoor/device evidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addPlayer,
  apply,
  createMatch,
  defaultConfig,
  discoveryZone,
  distance,
  disconnect,
  inArena,
  near,
  offset,
  project,
  tick,
  uid,
  type Match,
  type Command,
  type Mode,
} from "@fieldplay/engine";
const now = Date.now();
const center = { latitude: 41.9, longitude: 12.48 };
function command(m: Match, actor: string, c: Command, t = now) {
  return apply(m, actor, uid(), c, t);
}
function setup(mode: Mode = "treasure", count = 2) {
  let m = createMatch({ id: "host", name: "Ada" }, "Isolated test", now);
  for (let i = 1; i < count; i++)
    m = addPlayer(m, { id: `p${i}`, name: `Player ${i}` }, now);
  m = command(m, "host", {
    type: "configure",
    config: {
      ...defaultConfig(center),
      mode,
      checkpoints:
        mode === "domination"
          ? [center]
          : mode === "smugglers"
            ? [center, offset(center, 60, 1)]
            : [],
    },
  });
  return m;
}
function fix(m: Match, id: string, point = center, t = now) {
  return command(
    m,
    id,
    {
      type: "location",
      sample: { ...point, accuracy: 2, timestamp: t, provenance: "measured" },
    },
    t,
  );
}
function prepared(mode: Mode = "treasure", count = 2) {
  let m = setup(mode, count);
  for (const id of Object.keys(m.players)) {
    m = command(m, id, { type: "consent", accepted: true });
    m = fix(m, id);
    if (mode === "treasure")
      m = command(m, id, {
        type: "treasure",
        position: center,
        clue: `Clue from ${id}`,
        kind: "qr",
      });
    m = command(m, id, { type: "ready", ready: true });
  }
  return command(m, "host", { type: "start" });
}
function activeTreasure(count = 2) {
  let m = prepared("treasure", count);
  for (const id of Object.keys(m.players))
    m = command(m, id, { type: "returned" });
  return m;
}
test("derangements are bijections, no one receives their own treasure, with 2–20 players", () => {
  for (let count = 2; count <= 20; count++) {
    const m = prepared("treasure", count);
    const treasures = Object.values(m.treasures);
    assert.equal(new Set(treasures.map((t) => t.hunter)).size, count);
    for (const t of treasures) assert.notEqual(t.hunter, t.owner);
    assert.equal(m.phase, "return");
  }
});
test("full treasure lifecycle: prepare, return, clue, verify, score, results, stop sharing, replay", () => {
  let m = activeTreasure();
  const t = Object.values(m.treasures).find((t) => t.hunter === "host")!;
  assert.equal(project(m, "host").assignment?.clue, t.clue);
  m = command(m, "host", { type: "verify", code: t.code });
  assert.equal(m.phase, "finished");
  assert.equal(m.winner, "Ada");
  assert.ok(m.players.host.score > 100);
  assert.ok(
    Object.values(m.players).every((p) => !p.consent && p.samples.length === 0),
  );
  assert.equal(Object.keys(m.treasures).length, 0);
  assert.equal(m.results.length, 1);
  m = command(m, "host", { type: "replay" });
  assert.equal(m.phase, "lobby");
  assert.equal(m.results.length, 1);
  assert.ok(Object.values(m.players).every((p) => !p.ready && !p.consent));
});
test("first-install discovery circles contain hidden objective in every stage and never mark it exactly", () => {
  for (let seed = 0; seed < 10; seed++)
    for (let elapsed = 0; elapsed < 1500; elapsed += 17) {
      const z = discoveryZone(center, defaultConfig().discovery, elapsed, {
        angle: seed,
        fraction: 0.25 + seed / 100,
      });
      assert.ok(distance(z.center, center) < z.radius);
      assert.ok(distance(z.center, center) > 0);
    }
});
test("secret data is projected before transmission: other objective code, positions and assignments absent", () => {
  const m = activeTreasure(3);
  const v = project(m, "host");
  const target = Object.values(m.treasures).find((t) => t.hunter === "host")!;
  const serialized = JSON.stringify(v);
  assert.ok(!serialized.includes(target.code));
  assert.ok(!serialized.includes("hunter"));
  assert.equal(v.players.find((p) => p.id === "p1")?.location, undefined);
  assert.equal(v.ownTreasure?.code, m.treasures.host.code);
  assert.ok(!("treasures" in v));
  assert.throws(() => project(m, "unknown"));
});
test("GPS consent, plausible movement, accuracy, time ordering and simulated provenance are enforced", () => {
  let m = setup();
  assert.throws(() => fix(m, "host"), /sharing/);
  m = command(m, "host", { type: "consent", accepted: true });
  m = fix(m, "host");
  assert.throws(() => fix(m, "host", center, now), /Out-of-order/);
  assert.throws(
    () => fix(m, "host", offset(center, 1000, 0), now + 1000),
    /Implausible/,
  );
  assert.throws(
    () =>
      command(
        m,
        "host",
        {
          type: "location",
          sample: {
            ...center,
            accuracy: 1,
            timestamp: now + 1000,
            provenance: "simulated",
          },
        },
        now + 1000,
      ),
    /Simulated/,
  );
  assert.equal(
    near(
      { ...center, accuracy: 30, timestamp: now, provenance: "measured" },
      center,
      25,
      now,
    ),
    false,
  );
  assert.throws(
    () =>
      command(m, "host", {
        type: "treasure",
        position: offset(center, 1000, 0),
        clue: "Bad",
        kind: "virtual",
      }),
    /arena/,
  );
});
test("command replay does not duplicate chat, scoring or interactions", () => {
  let m = setup();
  const id = uid();
  m = apply(m, "host", id, { type: "chat", text: "Hello" }, now);
  const revision = m.revision;
  const again = apply(m, "host", id, { type: "chat", text: "Hello" }, now);
  assert.equal(again.chat.length, 1);
  assert.equal(again.revision, revision);
  assert.throws(
    () => command(m, "p1", { type: "configure", config: defaultConfig() }),
    /host/,
  );
  assert.throws(() =>
    apply(m, "p1", uid(), { type: "score", amount: 999 }, now),
  );
});
test("mode/configuration change revokes previous consent and readiness", () => {
  let m = setup();
  m = command(m, "host", { type: "consent", accepted: true });
  m = fix(m, "host");
  m = command(m, "host", {
    type: "configure",
    config: { ...m.config, mode: "manhunt" },
  });
  assert.equal(m.players.host.consent, false);
  assert.equal(m.players.host.samples.length, 0);
});
test("mutual capture is not automatic GPS tagging; target confirms once, hunters win", () => {
  let m = prepared("manhunt");
  assert.equal(m.players.p1.captured, false);
  m = command(m, "host", { type: "capture", target: "p1" });
  const i = m.interactions[0];
  assert.equal(m.players.p1.captured, false);
  assert.throws(
    () => command(m, "host", { type: "confirm", interactionId: i.id }),
    /belongs/,
  );
  m = command(m, "p1", { type: "confirm", interactionId: i.id });
  assert.equal(m.phase, "finished");
  assert.equal(m.winner, "Hunters");
  assert.throws(
    () => command(m, "p1", { type: "confirm", interactionId: i.id }),
    /not active/,
  );
});
test("expired captures rejected; stale or missing GPS never counts as confirmation", () => {
  let m = prepared("manhunt");
  m = command(m, "host", { type: "capture", target: "p1" });
  const id = m.interactions[0].id;
  assert.throws(
    () => command(m, "p1", { type: "confirm", interactionId: id }, now + 31000),
    /expired/,
  );
  assert.throws(
    () => command(m, "host", { type: "capture", target: "p1" }, now + 20000),
    /fresh/,
  );
});
test("Manhunt delay projects a coarse historical sample and never the newest coordinates", () => {
  let m = prepared("manhunt");
  m.config.pingDelay = 10;
  m.config.pingInterval = 10;
  const t = Math.floor((now + 65000) / 10000) * 10000 + 1000;
  const old = {
      ...center,
      accuracy: 2,
      timestamp: t - 11000,
      provenance: "measured" as const,
    },
    recent = {
      ...offset(center, 100, 0),
      accuracy: 2,
      timestamp: t,
      provenance: "measured" as const,
    };
  m.players.p1.samples = [old, recent];
  const location = project(m, "host", t).players.find(
    (p) => p.id === "p1",
  )!.location!;
  assert.ok(location);
  assert.equal(location.kind, "approximate");
  assert.equal(location.timestamp, old.timestamp);
  assert.ok(distance(location.position, recent) > 50);
});

test("zone elimination requires fresh accurate observations outside for 30 sec; stale data does not eliminate", () => {
  let m = prepared("manhunt");
  m.config.arena.radius = 50;
  m.config.duration = 120;
  for (let d = 5; d <= 35; d += 5) {
    m = fix(m, "p1", offset(center, 65, 0), now + d * 1000 + 1000);
    m = tick(m, now + d * 1000 + 1000);
  }
  assert.equal(m.players.p1.eliminated, true);
  assert.equal(m.phase, "finished");
});
test("domination requires multiple accurate samples, rejects contested claims, earns points after capture", () => {
  let m = prepared("domination");
  m = fix(m, "p1", offset(center, 60, 0), now + 10000);
  m = fix(m, "host", center, now + 5000);
  m = fix(m, "host", center, now + 10000);
  m = command(m, "host", { type: "claim", checkpoint: 0 }, now + 10000);
  assert.equal(m.checkpoints[0].progress, 25);
  for (let i = 1; i <= 3; i++) {
    m = fix(m, "host", center, now + 10000 + i * 5000);
    m = command(
      m,
      "host",
      { type: "claim", checkpoint: 0 },
      now + 10000 + i * 5000,
    );
  }
  assert.equal(m.checkpoints[0].owner, "violet");
  m = tick(m, now + 26000);
  assert.ok(m.teamScores.violet > 0);
});
test("smugglers deliver real authorized state; cargo ownership is hidden from opponents", () => {
  let m = prepared("smugglers");
  assert.throws(() => command(m, "host", { type: "pickup" }), /courier/);
  m = command(m, "p1", { type: "pickup" });
  assert.equal(
    project(m, "p1").players.find((p) => p.id === "p1")?.cargo,
    true,
  );
  assert.equal(
    project(m, "host").players.find((p) => p.id === "p1")?.cargo,
    undefined,
  );
  m = fix(m, "p1", m.config.checkpoints[1], now + 10000);
  m = command(m, "p1", { type: "deliver" }, now + 10000);
  assert.equal(m.teamScores.lime, 100);
  assert.throws(
    () => command(m, "p1", { type: "deliver" }, now + 10001),
    /cargo/,
  );
});
test("abilities validate role, cooldown, charges and privacy effects", () => {
  let m = prepared("manhunt");
  assert.throws(
    () => command(m, "host", { type: "ability", ability: "ghost" }),
    /role/,
  );
  m = command(m, "p1", { type: "ability", ability: "ghost" });
  assert.throws(
    () => command(m, "p1", { type: "ability", ability: "ghost" }),
    /recharging/,
  );
  assert.equal(
    project(m, "host").players.find((p) => p.id === "p1")?.location,
    undefined,
  );
  m = command(m, "p1", { type: "ability", ability: "shield" });
  assert.throws(
    () => command(m, "host", { type: "capture", target: "p1" }),
    /shielded/,
  );
});
test("disconnect and explicit withdrawal stop sharing safely, host never migrates secret state", () => {
  let m = prepared("manhunt");
  m = disconnect(m, "host", now + 1000);
  assert.equal(m.phase, "paused");
  assert.equal(m.players.host.samples.length, 0);
  assert.throws(() => command(m, "p1", { type: "resume" }, now + 2000), /host/);
  const m2 = command(prepared("manhunt"), "p1", { type: "leave" });
  assert.equal(m2.phase, "finished");
  assert.ok(Object.values(m2.players).every((p) => p.samples.length === 0));
});
test("polygon, circle, exclusions and timed victory", () => {
  const a = {
    center,
    radius: 100,
    exclusions: [{ center: offset(center, 30, 0), radius: 10 }],
  };
  assert.ok(inArena(center, a));
  assert.equal(inArena(offset(center, 30, 0), a), false);
  let m = prepared("manhunt");
  m = tick(m, now + (m.config.duration + 1) * 1000);
  assert.equal(m.winner, "Runners");
  assert.equal(m.phase, "finished");
});
