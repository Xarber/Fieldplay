// SPDX-License-Identifier: AGPL-3.0-only
import type { Command } from "../schema";
import type { Match, Player, Ability } from "../model";
import { uid } from "../random";
import { announce, finish, requireRule, checkLocation } from "../state";
import { distance, fresh, near, inArena } from "../geo";
type Context = { state: Match; player: Player; actor: string; now: number };
export function handleCapture(
  ctx: Context,
  c: Extract<Command, { type: "capture" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");

  active();
  requireRule(
    n.config.mode === "manhunt" || n.config.mode === "smugglers",
    "Captures are unavailable.",
  );
  const t = n.players[c.target];
  requireRule(
    t &&
      t.team !== p.team &&
      !t.captured &&
      !t.eliminated &&
      p.team === "violet",
    "Choose an opposing runner.",
  );
  requireRule(
    !t.abilities.shield || t.abilities.shield.until <= now,
    "That player is shielded.",
  );
  checkLocation(p, t.samples.at(-1) ?? { latitude: 0, longitude: 0 }, n, now);
  requireRule(
    fresh(t.samples.at(-1), now),
    "Other player needs a fresh GPS fix.",
  );
  requireRule(
    !n.interactions.some(
      (i) => i.actor === actor && i.target === t.id && i.expires > now,
    ),
    "Confirmation already requested.",
  );
  n.interactions.push({
    id: uid(),
    actor,
    target: t.id,
    expires: now + 30000,
  });
  announce(n, `${p.name} requested a non-contact confirmation.`, now);
}
export function handleConfirm(
  ctx: Context,
  c: Extract<Command, { type: "confirm" }>,
) {
  const { state: n, player: p, actor, now } = ctx;
  const active = () =>
    requireRule(n.phase === "active", "Match is not active.");
  const lobby = () =>
    requireRule(n.phase === "lobby", "Return to the lobby first.");

  active();
  const i = n.interactions.find(
    (i) => i.id === c.interactionId && i.target === actor && i.expires > now,
  );
  requireRule(i, "Confirmation expired or belongs to another player.");
  const a = n.players[i.actor];
  requireRule(a && a.consent && p.consent, "Location consent required.");
  checkLocation(p, a.samples.at(-1) ?? { latitude: 0, longitude: 0 }, n, now);
  requireRule(fresh(a.samples.at(-1), now), "Hunter needs a fresh GPS fix.");
  requireRule(
    !p.abilities.shield || p.abilities.shield.until <= now,
    "Shield is active.",
  );
  a.score += 50;
  n.teamScores.violet += 50;
  if (n.config.mode === "manhunt") p.captured = true;
  else {
    requireRule(p.cargo, "No cargo to intercept.");
    p.cargo = false;
  }
  n.interactions = n.interactions.filter((x) => x.target !== actor);
  announce(n, `${p.name} confirmed the encounter.`, now);
  if (
    n.config.mode === "manhunt" &&
    Object.values(n.players)
      .filter((v) => v.team === "lime")
      .every((v) => v.captured)
  )
    finish(n, "Hunters", now);
}
