// SPDX-License-Identifier: AGPL-3.0-only
import type { Command } from "../schema";
import type { Match, Player, Ability } from "../model";
import { uid, secretOffset } from "../random";
import { announce, finish, requireRule, checkLocation } from "../state";
import { distance, fresh, near, inArena } from "../geo";
type Context = { state: Match; player: Player; actor: string; now: number };
export function handleTreasure(
  ctx: Context,
  c: Extract<Command, { type: "treasure" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");
  lobby();
  requireRule(n.config.mode === "treasure", "Choose Treasure Hunt.");
  requireRule(
    inArena(c.position, n.config.arena),
    "Treasure must be inside the arena, outside exclusions.",
  );
  checkLocation(p, c.position, n, now);
  n.treasures[actor] = {
    owner: actor,
    position: c.position,
    clue: c.clue,
    kind: c.kind,
    code: uid(),
    offsets: n.config.discovery.map(() => secretOffset()),
    scannerOffsets: n.config.discovery.map(() => secretOffset()),
  };
  p.ready = false;
}
export function handleReturned(
  ctx: Context,
  c: Extract<Command, { type: "returned" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");
  requireRule(n.phase === "return", "Not in the return phase.");
  checkLocation(p, n.config.arena.center, n, now);
  p.returned = true;
  if (Object.values(n.players).every((v) => v.returned)) {
    n.phase = "active";
    n.startedAt = now;
    n.lastTick = now;
    announce(n, "Everyone is back. The hunt begins!", now);
  }
}
export function handleVerify(
  ctx: Context,
  c: Extract<Command, { type: "verify" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");

  active();
  requireRule(n.config.mode === "treasure", "Not a treasure game.");
  const t = Object.values(n.treasures).find((t) => t.hunter === actor);
  requireRule(t && !t.foundBy, "No remaining assignment.");
  requireRule(t.code === c.code, "Invalid or already used treasure code.");
  checkLocation(p, t.position, n, now);
  t.foundBy = actor;
  p.score +=
    100 +
    Math.max(
      0,
      Math.floor((n.config.duration - (now - n.startedAt!) / 1000) / 10),
    );
  announce(n, `${p.name} found a treasure!`, now);
  if (
    n.config.victory === "first" ||
    Object.values(n.treasures).every((t) => t.foundBy)
  )
    finish(
      n,
      n.config.victory === "first"
        ? p.name
        : Object.values(n.players).sort((a, b) => b.score - a.score)[0].name,
      now,
    );
}
