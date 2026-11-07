// SPDX-License-Identifier: AGPL-3.0-only
import type { Command } from "../schema";
import type { Match, Player, Ability } from "../model";
import { uid } from "../random";
import { announce, finish, requireRule, checkLocation } from "../state";
import { distance, fresh, near, inArena } from "../geo";
type Context = { state: Match; player: Player; actor: string; now: number };
export function handleAbility(
  ctx: Context,
  c: Extract<Command, { type: "ability" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");

  active();
  requireRule(
    !p.captured && !p.eliminated,
    "Captured or eliminated players cannot use abilities.",
  );
  const old = p.abilities[c.ability];
  requireRule(
    !old || (old.cooldown <= now && old.charges > 0),
    "Ability is recharging or out of charges.",
  );
  const permitted: Record<Ability, boolean> = {
    scanner: n.config.mode === "treasure",
    radar: p.team === "violet" && n.config.mode !== "treasure",
    ghost: p.team === "lime",
    decoy: p.team === "lime",
    shield: true,
    rescue: p.team === "lime" && n.config.mode === "manhunt",
    jammer: p.team === "lime",
    proximity: true,
  };
  requireRule(permitted[c.ability], "Ability unavailable for this role.");
  if (c.ability === "rescue") {
    const target = Object.values(n.players).find(
      (v) =>
        v.team === p.team &&
        v.captured &&
        fresh(v.samples.at(-1), now) &&
        near(
          p.samples.at(-1),
          v.samples.at(-1)!,
          n.config.interactionRadius,
          now,
        ),
    );
    requireRule(target, "Stand near a captured teammate to rescue.");
    target.captured = false;
    p.score += 25;
  }
  p.abilities[c.ability] = {
    until: now + 15000,
    cooldown: now + 60000,
    charges: (old?.charges ?? 3) - 1,
  };
  announce(n, `${p.name} activated an ability.`, now);
}
