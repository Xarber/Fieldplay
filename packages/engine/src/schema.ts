// SPDX-License-Identifier: AGPL-3.0-only
import { z } from "zod";
export const pointSchema = z.object({
  latitude: z.number().min(-85).max(85),
  longitude: z.number().min(-180).max(180),
});
export type Point = z.infer<typeof pointSchema>;
export const sampleSchema = pointSchema.extend({
  accuracy: z.number().min(0).max(1000),
  timestamp: z.number().finite(),
  provenance: z.enum(["measured", "simulated"]),
});
export type Sample = z.infer<typeof sampleSchema>;
export const arenaSchema = z.object({
  center: pointSchema,
  radius: z.number().min(50).max(5000),
  polygon: z.array(pointSchema).min(3).max(40).optional(),
  exclusions: z
    .array(
      z.object({ center: pointSchema, radius: z.number().min(5).max(1000) }),
    )
    .max(20)
    .default([]),
});
export type Arena = z.infer<typeof arenaSchema>;
export const modeSchema = z.enum([
  "treasure",
  "manhunt",
  "domination",
  "smugglers",
]);
export type Mode = z.infer<typeof modeSchema>;
export const configSchema = z
  .object({
    schemaVersion: z.literal(1),
    mode: modeSchema,
    duration: z.number().int().min(60).max(10800),
    arena: arenaSchema,
    discovery: z
      .array(
        z.object({
          after: z.number().int().min(0).max(10800),
          radius: z.number().min(10).max(5000),
        }),
      )
      .min(1)
      .max(12)
      .default([
        { after: 0, radius: 300 },
        { after: 300, radius: 200 },
        { after: 600, radius: 120 },
        { after: 900, radius: 70 },
        { after: 1200, radius: 30 },
      ]),
    pingDelay: z.number().int().min(10).max(180).default(30),
    pingInterval: z.number().int().min(10).max(180).default(30),
    interactionRadius: z.number().min(5).max(50).default(25),
    victory: z.enum(["first", "points"]).default("first"),
    checkpoints: z.array(pointSchema).max(8).default([]),
    movingHill: z.boolean().default(false),
  })
  .superRefine((c, ctx) => {
    if (c.discovery[0].after !== 0)
      ctx.addIssue({
        code: "custom",
        message: "First discovery stage must start at zero.",
      });
    c.discovery.forEach((s, i) => {
      if (
        i &&
        (s.after <= c.discovery[i - 1].after ||
          s.radius > c.discovery[i - 1].radius)
      )
        ctx.addIssue({
          code: "custom",
          message:
            "Discovery stages must increase in time and contract in radius.",
        });
    });
  });
export type Config = z.infer<typeof configSchema>;
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("configure"), config: configSchema }),
  z.object({ type: z.literal("consent"), accepted: z.boolean() }),
  z.object({ type: z.literal("ready"), ready: z.boolean() }),
  z.object({
    type: z.literal("team"),
    playerId: z.string().max(80),
    team: z.enum(["violet", "lime"]),
  }),
  z.object({
    type: z.literal("treasure"),
    position: pointSchema,
    clue: z.string().min(1).max(300),
    kind: z.enum(["virtual", "physical", "qr"]),
  }),
  z.object({ type: z.literal("location"), sample: sampleSchema }),
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("returned") }),
  z.object({ type: z.literal("verify"), code: z.string().min(8).max(100) }),
  z.object({ type: z.literal("capture"), target: z.string().max(80) }),
  z.object({ type: z.literal("confirm"), interactionId: z.string().max(80) }),
  z.object({
    type: z.literal("claim"),
    checkpoint: z.number().int().min(0).max(7),
  }),
  z.object({ type: z.literal("pickup") }),
  z.object({ type: z.literal("deliver") }),
  z.object({
    type: z.literal("ability"),
    ability: z.enum([
      "scanner",
      "radar",
      "ghost",
      "decoy",
      "shield",
      "rescue",
      "jammer",
      "proximity",
    ]),
  }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("resume") }),
  z.object({ type: z.literal("end") }),
  z.object({ type: z.literal("replay") }),
  z.object({
    type: z.literal("chat"),
    text: z.string().trim().min(1).max(500),
  }),
  z.object({
    type: z.literal("kick"),
    playerId: z.string().max(80),
    ban: z.boolean().default(false),
  }),
  z.object({ type: z.literal("cohost"), playerId: z.string().max(80) }),
  z.object({
    type: z.literal("report"),
    text: z.string().trim().min(1).max(500),
  }),
  z.object({ type: z.literal("leave") }),
]);
export type Command = z.infer<typeof commandSchema>;
export const envelopeSchema = z.object({
  id: z.string().min(8).max(100),
  command: commandSchema,
});
export const defaultConfig = (
  center: Point = { latitude: 41.914, longitude: 12.486 },
): Config =>
  configSchema.parse({
    schemaVersion: 1,
    mode: "treasure",
    duration: 1500,
    arena: { center, radius: 350 },
  });
export const MODES = [
  {
    id: "treasure",
    name: "Treasure Hunt",
    icon: "◇",
    label: "Find your next adventure",
    description:
      "Trade secrets. Follow clues. Find a friend’s hidden treasure.",
    players: "2–20",
    tone: "#FAC76A",
    tags: "EXPLORATION · CLUES",
  },
  {
    id: "manhunt",
    name: "Manhunt",
    icon: "◎",
    label: "Stay one step ahead",
    description: "Hunters follow delayed pings. Runners outlast the clock.",
    players: "2–20",
    tone: "#FC8A9D",
    tags: "STEALTH · SURVIVAL",
  },
  {
    id: "domination",
    name: "Checkpoint Domination",
    icon: "⚑",
    label: "Make your mark",
    description: "Capture checkpoints together and hold your ground.",
    players: "2–20",
    tone: "#B8E89A",
    tags: "TEAMS · TERRITORY",
  },
  {
    id: "smugglers",
    name: "Smugglers vs. Customs",
    icon: "▣",
    label: "Keep the delivery quiet",
    description: "Move secret cargo. Outsmart the opposing team.",
    players: "2–20",
    tone: "#94D9EB",
    tags: "DELIVERY · STRATEGY",
  },
] as const;
