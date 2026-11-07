// SPDX-License-Identifier: AGPL-3.0-only
import type { Command } from "../schema";
import type { Match, Player, Ability } from "../model";
import { uid } from "../random";
import { announce, finish, requireRule, checkLocation } from "../state";
import { distance, fresh, near, inArena } from "../geo";
type Context = { state: Match; player: Player; actor: string; now: number };
export function handlePickup(
  ctx: Context,
  c: Extract<Command, { type: "pickup" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");
  active();
  requireRule(
    n.config.mode === "smugglers" && p.team === "lime" && !p.cargo,
    "Only an empty-handed courier can collect cargo.",
  );
  checkLocation(p, n.config.checkpoints[0], n, now);
  p.cargo = true;
  announce(n, `${p.name} collected sealed cargo.`, now);
}
export function handleDeliver(
  ctx: Context,
  c: Extract<Command, { type: "deliver" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");
  active();
  requireRule(
    n.config.mode === "smugglers" && p.team === "lime" && p.cargo,
    "No cargo to deliver.",
  );
  checkLocation(p, n.config.checkpoints[1], n, now);
  p.cargo = false;
  p.score += 100;
  n.teamScores.lime += 100;
  announce(n, `${p.name} completed a delivery.`, now);
}
