// SPDX-License-Identifier: AGPL-3.0-only
import type { Config, Point, Sample } from "./schema";
export type Phase = "lobby" | "return" | "active" | "paused" | "finished";
export type Ability =
  | "scanner"
  | "radar"
  | "ghost"
  | "decoy"
  | "shield"
  | "rescue"
  | "jammer"
  | "proximity";
export type Player = {
  id: string;
  name: string;
  team: "violet" | "lime";
  ready: boolean;
  consent: boolean;
  returned: boolean;
  score: number;
  captured: boolean;
  connected: boolean;
  cargo: boolean;
  eliminated: boolean;
  outsideSince?: number;
  samples: Sample[];
  abilities: Partial<
    Record<Ability, { until: number; cooldown: number; charges: number }>
  >;
};
type Treasure = {
  owner: string;
  position: Point;
  clue: string;
  kind: "virtual" | "physical" | "qr";
  code: string;
  hunter?: string;
  foundBy?: string;
  offsets: { angle: number; fraction: number }[];
  scannerOffsets: { angle: number; fraction: number }[];
};
export type Match = {
  id: string;
  name: string;
  hostId: string;
  cohosts: string[];
  players: Record<string, Player>;
  config: Config;
  phase: Phase;
  previousPhase?: Phase;
  createdAt: number;
  startedAt?: number;
  pausedAt?: number;
  revision: number;
  treasures: Record<string, Treasure>;
  processed: string[];
  banned: string[];
  interactions: {
    id: string;
    actor: string;
    target: string;
    expires: number;
  }[];
  chat: { id: string; player: string; text: string; at: number }[];
  events: { text: string; at: number }[];
  checkpoints: {
    owner?: "violet" | "lime";
    progress: number;
    claimant?: string;
    lastTick?: number;
  }[];
  teamScores: { violet: number; lime: number };
  winner?: string;
  finishedAt?: number;
  lastTick?: number;
  results: {
    at: number;
    mode: string;
    winner: string;
    scores: { name: string; score: number }[];
  }[];
  simulation: boolean;
};
