// SPDX-License-Identifier: AGPL-3.0-only
import type { Command } from "../schema";
import type { Match, Player, Ability } from "../model";
import { uid } from "../random";
import { announce, finish, requireRule, checkLocation } from "../state";
import { distance, fresh, near, inArena } from "../geo";
type Context = { state: Match; player: Player; actor: string; now: number };
export function handleClaim(
  ctx: Context,
  c: Extract<Command, { type: "claim" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");

  active();
  requireRule(n.config.mode === "domination", "Not a territory game.");
  const point = n.config.checkpoints[c.checkpoint];
  requireRule(point, "Unknown checkpoint.");
  if (n.config.movingHill)
    requireRule(
      c.checkpoint ===
        Math.floor((now - n.startedAt!) / 60000) % n.checkpoints.length,
      "This hill is inactive.",
    );
  checkLocation(p, point, n, now);
  const samples = p.samples.filter(
    (s) =>
      now - s.timestamp <= 20000 &&
      near(s, point, n.config.interactionRadius, now),
  );
  requireRule(
    samples.length >= 3 &&
      samples.at(-1)!.timestamp - samples[0].timestamp >= 5000,
    "Stay here for three accurate GPS samples spanning five seconds.",
  );
  requireRule(
    !Object.values(n.players).some(
      (v) =>
        v.team !== p.team &&
        near(v.samples.at(-1), point, n.config.interactionRadius, now),
    ),
    "Checkpoint contested. Both teams are present.",
  );
  const cp = n.checkpoints[c.checkpoint];
  if (cp.owner !== p.team) {
    if (cp.claimant !== p.team) {
      cp.progress = 0;
      cp.claimant = p.team;
    }
    requireRule(
      !cp.lastTick || now - cp.lastTick >= 5000,
      "Hold position before claiming again.",
    );
    cp.progress = Math.min(100, cp.progress + 25);
    cp.lastTick = now;
    if (cp.progress === 100) {
      cp.owner = p.team;
      p.score += 25;
      announce(n, `${p.name} captured checkpoint ${c.checkpoint + 1}.`, now);
    }
  }
}
