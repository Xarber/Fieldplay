export * from "./model";
export * from "./visibility";
export { uid } from "./random";
import { uid } from "./random";
import type { Match, Player, Ability } from "./model";
import { announce, finish, requireRule, checkLocation } from "./state";
import { handleAbility } from "./rules/abilities";
import { handlePickup, handleDeliver } from "./rules/cargo";
import { handleClaim } from "./rules/territory";
import { handleCapture, handleConfirm } from "./rules/encounters";
import { handleTreasure, handleReturned, handleVerify } from "./rules/treasure";
// SPDX-License-Identifier: AGPL-3.0-only
export * from "./schema";
export * from "./geo";
import {
  commandSchema,
  configSchema,
  defaultConfig,
  type Config,
  type Point,
  type Sample,
  type Command,
} from "./schema";
import {
  distance,
  discoveryZone,
  fresh,
  inArena,
  near,
  offset,
  survivalZone,
} from "./geo";
export function createMatch(
  host: { id: string; name: string },
  name = "Weekend explorers",
  now = Date.now(),
): Match {
  const m: Match = {
    id: uid(),
    name,
    hostId: host.id,
    cohosts: [],
    players: {},
    config: defaultConfig(),
    phase: "lobby",
    createdAt: now,
    revision: 0,
    treasures: {},
    processed: [],
    banned: [],
    interactions: [],
    chat: [],
    events: [],
    checkpoints: [],
    teamScores: { violet: 0, lime: 0 },
    results: [],
    simulation: false,
  };
  return addPlayer(m, host, now);
}
export function addPlayer(
  m: Match,
  p: { id: string; name: string },
  now = Date.now(),
): Match {
  requireRule(!m.banned.includes(p.id), "You cannot join this party.");
  requireRule(
    m.phase === "lobby" || !!m.players[p.id],
    "Match already started.",
  );
  requireRule(
    Object.keys(m.players).length < 20 || !!m.players[p.id],
    "Party is full.",
  );
  const next = structuredClone(m);
  if (next.players[p.id]) next.players[p.id].connected = true;
  else
    next.players[p.id] = {
      id: p.id,
      name: p.name.slice(0, 32),
      team: Object.keys(m.players).length % 2 ? "lime" : "violet",
      ready: false,
      consent: false,
      returned: false,
      score: 0,
      captured: false,
      connected: true,
      cargo: false,
      eliminated: false,
      samples: [],
      abilities: {},
    };
  next.revision++;
  next.events.push({ text: `${p.name} joined the party`, at: now });
  return next;
}
export function disconnect(m: Match, id: string, now = Date.now()): Match {
  const n = structuredClone(m);
  if (n.players[id]) {
    n.players[id].connected = false;
    n.players[id].samples = [];
    n.players[id].ready = false;
  }
  if (
    (id === n.hostId || n.phase === "active" || n.phase === "return") &&
    n.phase !== "finished" &&
    n.phase !== "paused" &&
    n.phase !== "lobby"
  ) {
    n.previousPhase = n.phase;
    n.phase = "paused";
    n.pausedAt = now;
    announce(n, "Connection lost. Match safely paused.", now);
  }
  n.revision++;
  return n;
}
export function apply(
  m: Match,
  actor: string,
  eventId: string,
  input: Command | unknown,
  now = Date.now(),
): Match {
  requireRule(
    !!m.players[actor] && m.players[actor].connected,
    "Not a connected party member.",
  );
  if (m.processed.includes(eventId)) return m;
  const c = commandSchema.parse(input);
  const n = structuredClone(m);
  const p = n.players[actor];
  const host = actor === n.hostId || n.cohosts.includes(actor);
  const admin = () => requireRule(host, "Only a host can do that.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  switch (c.type) {
    case "configure":
      admin();
      lobby();
      requireRule(
        c.config.checkpoints.every((x) => inArena(x, c.config.arena)),
        "Checkpoints must be in the arena.",
      );
      if (c.config.mode === "smugglers" && c.config.checkpoints.length >= 2)
        requireRule(
          distance(c.config.checkpoints[0], c.config.checkpoints[1]) >=
            c.config.interactionRadius * 2,
          "Pickup and delivery must be at least two interaction radii apart.",
        );
      n.config = configSchema.parse(c.config);
      n.treasures = {};
      for (const v of Object.values(n.players)) {
        v.ready = false;
        v.consent = false;
        v.samples = [];
      }
      break;
    case "consent":
      p.consent = c.accepted;
      if (!c.accepted) {
        p.samples = [];
        p.ready = false;
        if (n.phase === "active" || n.phase === "return") {
          n.previousPhase = n.phase;
          n.phase = "paused";
          n.pausedAt = now;
          for (const v of Object.values(n.players)) v.samples = [];
          announce(n, "Location sharing stopped. Safety pause.", now);
        }
      }
      break;
    case "ready":
      lobby();
      requireRule(
        !c.ready || p.consent,
        "Review and accept the location rules first.",
      );
      if (c.ready && n.config.mode === "treasure")
        requireRule(n.treasures[actor], "Register your treasure first.");
      p.ready = c.ready;
      break;
    case "team":
      admin();
      lobby();
      requireRule(!!n.players[c.playerId], "Unknown player.");
      n.players[c.playerId].team = c.team;
      for (const v of Object.values(n.players)) v.ready = false;
      break;
    case "cohost":
      admin();
      lobby();
      requireRule(!!n.players[c.playerId], "Unknown player.");
      n.cohosts = n.cohosts.includes(c.playerId)
        ? n.cohosts.filter((x) => x !== c.playerId)
        : [...n.cohosts, c.playerId];
      break;
    case "treasure":
      handleTreasure({ state: n, player: p, actor, now }, c);
      break;
    case "location": {
      requireRule(
        p.consent && ["lobby", "return", "active"].includes(n.phase),
        "Location sharing is stopped.",
      );
      const s = c.sample;
      requireRule(
        s.timestamp <= now + 3000 && now - s.timestamp <= 15000,
        "Stale or future GPS sample.",
      );
      requireRule(
        s.provenance === "measured" || n.simulation,
        "Simulated locations are disabled in real games.",
      );
      const last = p.samples.at(-1);
      requireRule(
        !last || s.timestamp > last.timestamp,
        "Out-of-order location sample.",
      );
      if (
        last &&
        s.timestamp - last.timestamp < 60000 &&
        last.accuracy <= 30 &&
        s.accuracy <= 30
      )
        requireRule(
          distance(last, s) <=
            Math.max(0, (s.timestamp - last.timestamp) / 1000) * 12 +
              last.accuracy +
              s.accuracy +
              10,
          "Implausible movement. Stop and retry with a fresh fix.",
        );
      p.samples = [
        ...p.samples.filter((x) => now - x.timestamp <= 240000),
        s,
      ].slice(-100);
      break;
    }
    case "start": {
      admin();
      lobby();
      const players = Object.values(n.players);
      requireRule(
        players.length >= 2 &&
          players.every((v) => v.ready && v.consent && v.connected),
        "At least two connected, ready players with consent are required.",
      );
      if (n.config.mode !== "treasure")
        requireRule(
          players.some((v) => v.team === "violet") &&
            players.some((v) => v.team === "lime"),
          "Both teams need a player.",
        );
      if (n.config.mode === "domination")
        requireRule(
          n.config.checkpoints.length >= 1,
          "Place at least one checkpoint.",
        );
      if (n.config.mode === "smugglers")
        requireRule(
          n.config.checkpoints.length >= 2,
          "Place pickup and delivery points.",
        );
      n.teamScores = { violet: 0, lime: 0 };
      n.checkpoints = n.config.checkpoints.map(() => ({ progress: 0 }));
      if (n.config.mode === "treasure") {
        requireRule(
          players.every((v) => n.treasures[v.id]),
          "Every player needs a treasure.",
        );
        // CSPRNG Fisher–Yates followed by a cycle: bijective derangement, no self assignment.
        const ids = players.map((v) => v.id);
        for (let i = ids.length - 1; i > 0; i--) {
          const bytes = new Uint32Array(1);
          let r: number;
          const bound = Math.floor(0x100000000 / (i + 1)) * (i + 1);
          do {
            crypto.getRandomValues(bytes);
            r = bytes[0];
          } while (r >= bound);
          const j = r % (i + 1);
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        ids.forEach((id, i) => {
          n.treasures[ids[(i + 1) % ids.length]].hunter = id;
        });
        n.phase = "return";
        announce(n, "Treasures assigned. Return to the starting area.", now);
      } else {
        n.phase = "active";
        n.startedAt = now;
        n.lastTick = now;
        announce(n, "The match is live.", now);
      }
      break;
    }
    case "returned":
      handleReturned({ state: n, player: p, actor, now }, c);
      break;
    case "verify":
      handleVerify({ state: n, player: p, actor, now }, c);
      break;
    case "capture":
      handleCapture({ state: n, player: p, actor, now }, c);
      break;
    case "confirm":
      handleConfirm({ state: n, player: p, actor, now }, c);
      break;
    case "claim":
      handleClaim({ state: n, player: p, actor, now }, c);
      break;
    case "pickup":
      handlePickup({ state: n, player: p, actor, now }, c);
      break;
    case "deliver":
      handleDeliver({ state: n, player: p, actor, now }, c);
      break;
    case "ability":
      handleAbility({ state: n, player: p, actor, now }, c);
      break;
    case "pause":
      requireRule(
        n.phase === "active" || n.phase === "return",
        "Nothing to pause.",
      );
      n.previousPhase = n.phase;
      n.phase = "paused";
      n.pausedAt = now;
      for (const v of Object.values(n.players)) v.samples = [];
      announce(n, "Safety pause. Location transmission stopped.", now);
      break;
    case "resume":
      admin();
      requireRule(n.phase === "paused", "Match is not paused.");
      requireRule(
        Object.values(n.players).every((v) => v.consent && v.connected),
        "Everyone must reconnect and consent before resuming.",
      );
      if (n.startedAt) n.startedAt += now - n.pausedAt!;
      n.lastTick = now;
      n.phase = n.previousPhase ?? "active";
      announce(n, "Match resumed.", now);
      break;
    case "end":
      admin();
      requireRule(
        n.phase !== "finished" && n.phase !== "lobby",
        "No running match.",
      );
      finish(n, "Match ended by host", now);
      break;
    case "replay":
      admin();
      requireRule(n.phase === "finished", "Finish this match first.");
      n.phase = "lobby";
      n.treasures = {};
      n.checkpoints = [];
      n.interactions = [];
      n.teamScores = { violet: 0, lime: 0 };
      n.winner = undefined;
      n.startedAt = undefined;
      n.finishedAt = undefined;
      for (const v of Object.values(n.players)) {
        v.ready = false;
        v.returned = false;
        v.captured = false;
        v.eliminated = false;
        v.outsideSince = undefined;
        v.cargo = false;
        v.score = 0;
        v.consent = false;
        v.samples = [];
        v.abilities = {};
      }
      announce(
        n,
        "New round. Register new treasures and review sharing rules.",
        now,
      );
      break;
    case "chat":
      n.chat.push({ id: eventId, player: p.name, text: c.text, at: now });
      n.chat = n.chat.slice(-80);
      break;
    case "report":
      announce(n, `Integrity report from ${p.name}: ${c.text}`, now);
      break;
    case "kick":
      admin();
      requireRule(
        c.playerId !== n.hostId && !!n.players[c.playerId],
        "Cannot remove this player.",
      );
      if (c.ban) n.banned.push(c.playerId);
      delete n.players[c.playerId];
      delete n.treasures[c.playerId];
      if (n.phase !== "lobby" && n.phase !== "finished")
        finish(n, "Match ended after roster change", now);
      break;
    case "leave":
      p.consent = false;
      p.samples = [];
      p.connected = false;
      p.ready = false;
      if (n.phase !== "lobby" && n.phase !== "finished")
        finish(n, "Match ended after a player withdrew", now);
      else if (actor !== n.hostId) {
        delete n.players[actor];
        delete n.treasures[actor];
      }
      break;
  }
  n.processed = [...n.processed, eventId].slice(-2000);
  n.revision++;
  return n;
}
export function tick(m: Match, now = Date.now()): Match {
  if (m.phase !== "active") return m;
  const n = structuredClone(m);
  const elapsed = (now - n.startedAt!) / 1000;
  for (const p of Object.values(n.players))
    p.samples = p.samples.filter((s) => now - s.timestamp <= 240000);
  n.interactions = n.interactions.filter((i) => i.expires > now);
  if (n.config.mode === "manhunt") {
    const zone = survivalZone(n.config.arena, elapsed, n.config.duration);
    for (const p of Object.values(n.players)) {
      if (p.team !== "lime" || p.captured || p.eliminated) continue;
      const s = p.samples.at(-1);
      if (!fresh(s, now)) {
        p.outsideSince = undefined;
        continue;
      }
      if (distance(s, zone.center) - s.accuracy > zone.radius) {
        p.outsideSince ??= now;
        if (now - p.outsideSince >= 30000) {
          p.eliminated = true;
          announce(
            n,
            `${p.name} was eliminated after 30 seconds outside the survival zone.`,
            now,
          );
        }
      } else p.outsideSince = undefined;
    }
    if (
      Object.values(n.players)
        .filter((p) => p.team === "lime")
        .every((p) => p.captured || p.eliminated)
    ) {
      finish(n, "Hunters", now);
      n.revision++;
      return n;
    }
  }
  const dt = Math.min(2, Math.max(0, (now - (n.lastTick ?? now)) / 1000));
  n.lastTick = now;
  if (n.config.mode === "domination")
    n.checkpoints.forEach((cp, i) => {
      if (
        cp.owner &&
        (!n.config.movingHill ||
          i === Math.floor(elapsed / 60) % n.checkpoints.length)
      )
        n.teamScores[cp.owner] += dt;
    });
  if (elapsed >= n.config.duration) {
    let winner: string;
    if (n.config.mode === "manhunt")
      winner = Object.values(n.players).some(
        (v) => v.team === "lime" && !v.captured && !v.eliminated,
      )
        ? "Runners"
        : "Hunters";
    else if (n.config.mode === "treasure") {
      const ranking = Object.values(n.players).sort(
        (a, b) => b.score - a.score,
      );
      winner = ranking[0].score
        ? ranking
            .filter((p) => p.score === ranking[0].score)
            .map((p) => p.name)
            .join(" & ")
        : "No treasure found";
    } else
      winner =
        n.teamScores.violet === n.teamScores.lime
          ? "Draw"
          : n.teamScores.violet > n.teamScores.lime
            ? "Violet team"
            : "Lime team";
    finish(n, winner, now);
  }
  n.revision++;
  return n;
}
