// SPDX-License-Identifier: AGPL-3.0-only
import type { Match } from "./model";
import type { Point } from "./schema";
import { requireRule } from "./state";
import { distance, discoveryZone, fresh, offset, survivalZone } from "./geo";
export function project(m: Match, viewerId: string, now = Date.now()) {
  requireRule(
    m.players[viewerId]?.connected && !m.banned.includes(viewerId),
    "Not an authorized viewer.",
  );
  const self = m.players[viewerId];
  const elapsed = m.startedAt
    ? Math.max(
        0,
        ((m.phase === "paused" ? m.pausedAt! : now) - m.startedAt) / 1000,
      )
    : 0;
  const own = m.treasures[viewerId];
  const assignment = Object.values(m.treasures).find(
    (t) => t.hunter === viewerId,
  );
  const players = Object.values(m.players).map((p) => {
    let location:
      | {
          position: Point;
          accuracy: number;
          timestamp: number;
          kind: "measured" | "delayed" | "approximate";
          radius?: number;
        }
      | undefined;
    const s = p.samples.at(-1);
    const sharing = m.phase === "active" && p.consent && self.consent;
    if (
      sharing &&
      s &&
      now - s.timestamp <= 30000 &&
      (p.id === viewerId ||
        (p.team === self.team && m.config.mode !== "treasure"))
    )
      location = {
        position: { latitude: s.latitude, longitude: s.longitude },
        accuracy: s.accuracy,
        timestamp: s.timestamp,
        kind: "measured",
      };
    else if (
      sharing &&
      m.config.mode !== "treasure" &&
      (!p.abilities.ghost || p.abilities.ghost.until <= now) &&
      (!p.abilities.jammer || p.abilities.jammer.until <= now)
    ) {
      const snapshot =
        Math.floor(now / (m.config.pingInterval * 1000)) *
          m.config.pingInterval *
          1000 -
        m.config.pingDelay * 1000;
      const delayed = [...p.samples]
        .reverse()
        .find((s) => s.timestamp <= snapshot && snapshot - s.timestamp < 30000);
      if (delayed) {
        const coarse = {
          latitude: Math.round(delayed.latitude * 1000) / 1000,
          longitude: Math.round(delayed.longitude * 1000) / 1000,
        };
        const decoy = p.abilities.decoy && p.abilities.decoy.until > now;
        location = {
          position: decoy ? offset(coarse, 80, 1) : coarse,
          accuracy: Math.max(delayed.accuracy, 100),
          timestamp: delayed.timestamp,
          kind: "approximate",
          radius: 150,
        };
      }
    }
    return {
      id: p.id,
      name: p.name,
      team: p.team,
      ready: p.ready,
      consent: p.consent,
      returned: p.returned,
      score: p.score,
      captured: p.captured,
      eliminated: p.eliminated,
      outsideSince: p.id === viewerId ? p.outsideSince : undefined,
      connected: p.connected,
      hasTreasure: !!m.treasures[p.id],
      location,
      ...(p.id === viewerId ? { cargo: p.cargo, abilities: p.abilities } : {}),
    };
  });
  const stageIndex = Math.max(
    0,
    m.config.discovery.reduce(
      (selected, s, i) => (s.after <= elapsed ? i : selected),
      0,
    ),
  );
  let zone =
    assignment && m.phase === "active"
      ? discoveryZone(
          assignment.position,
          m.config.discovery,
          elapsed,
          assignment.offsets[stageIndex],
        )
      : undefined;
  if (zone && self.abilities.scanner && self.abilities.scanner.until > now)
    zone = discoveryZone(
      assignment!.position,
      [{ after: 0, radius: Math.max(10, zone.radius * 0.65) }],
      0,
      assignment!.scannerOffsets[stageIndex],
    );
  return {
    id: m.id,
    name: m.name,
    hostId: m.hostId,
    cohosts: m.cohosts,
    config: m.config,
    phase: m.phase,
    revision: m.revision,
    players,
    serverTime: now,
    remaining: Math.max(0, m.config.duration - elapsed),
    teamScores: m.teamScores,
    winner: m.winner,
    ownTreasure: own
      ? {
          clue: own.clue,
          code: own.code,
          kind: own.kind,
          position: own.position,
        }
      : undefined,
    assignment:
      assignment && m.phase === "active"
        ? {
            clue: assignment.clue,
            kind: assignment.kind,
            found: !!assignment.foundBy,
            zone,
          }
        : undefined,
    survival:
      m.config.mode === "manhunt" && m.phase === "active"
        ? survivalZone(m.config.arena, elapsed, m.config.duration)
        : undefined,
    checkpoints: m.checkpoints,
    interactions: m.interactions.filter(
      (i) => i.target === viewerId || i.actor === viewerId,
    ),
    chat: m.chat,
    events: m.events.slice(-12),
    results: m.results,
    proximity:
      self.abilities.proximity && self.abilities.proximity.until > now
        ? Object.values(m.players).filter(
            (p) =>
              p.id !== viewerId &&
              p.team !== self.team &&
              fresh(p.samples.at(-1), now) &&
              fresh(self.samples.at(-1), now) &&
              distance(p.samples.at(-1)!, self.samples.at(-1)!) < 100,
          ).length
        : undefined,
    radar:
      self.abilities.radar && self.abilities.radar.until > now
        ? players
            .filter((p) => p.team !== self.team && p.location)
            .map((p) => ({
              id: p.id,
              zone: { center: p.location!.position, radius: 150 },
            }))
        : undefined,
    simulation: m.simulation,
  };
}
export type View = ReturnType<typeof project>;
