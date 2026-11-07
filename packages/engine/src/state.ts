// SPDX-License-Identifier: AGPL-3.0-only
import type { Match, Player } from "./model";
import type { Point } from "./schema";
import { near } from "./geo";
export function requireRule(ok: unknown, text: string): asserts ok {
  if (!ok) throw new Error(text);
}
export function announce(m: Match, text: string, now: number) {
  m.events.push({ text, at: now });
  m.events = m.events.slice(-30);
}
export function finish(m: Match, winner: string, now: number) {
  m.phase = "finished";
  m.winner = winner;
  m.finishedAt = now;
  m.results.unshift({
    at: now,
    mode: m.config.mode,
    winner,
    scores: Object.values(m.players).map((p) => ({
      name: p.name,
      score: p.score,
    })),
  });
  m.results = m.results.slice(0, 20);
  for (const p of Object.values(m.players)) {
    p.consent = false;
    p.samples = [];
    p.abilities = {};
  }
  m.interactions = [];
  m.treasures = {};
  announce(m, "Match complete. Location sharing stopped.", now);
}
export function checkLocation(p: Player, point: Point, m: Match, now: number) {
  requireRule(p.consent, "Accept location sharing first.");
  requireRule(
    near(p.samples.at(-1), point, m.config.interactionRadius, now),
    "A fresh, accurate GPS fix inside the interaction area is required.",
  );
}
