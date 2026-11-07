// SPDX-License-Identifier: AGPL-3.0-only
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  compatibleUpgrade,
  newerVersion,
  validVersion,
} from "@fieldplay/engine";
import { z } from "zod";
import { read, write } from "./storage";
export const VERSION = Constants.expoConfig?.version ?? "0.1.0";
export const BUILD = String(Constants.expoConfig?.extra?.buildNumber ?? "1");
export const build = {
  version: VERSION,
  build: BUILD,
  commit: String(Constants.expoConfig?.extra?.buildCommit ?? "development"),
  date:
    typeof Constants.expoConfig?.extra?.buildDate === "string" &&
    Constants.expoConfig.extra.buildDate
      ? Constants.expoConfig.extra.buildDate
      : null,
  channel: String(Constants.expoConfig?.extra?.channel ?? "testing"),
  variant: "private",
};
export const changelog = [
  {
    version: "0.1.0",
    date: "2026-11-06",
    published: false,
    highlights: [
      {
        icon: "compass",
        title: "Your first outdoor adventure",
        body: "Private lobbies, GPS treasure registration, secret assignments and verified discoveries.",
      },
      {
        icon: "radio",
        title: "Play with a real connection",
        body: "Host-authoritative WebRTC or your own dedicated WebSocket server.",
      },
      {
        icon: "flag",
        title: "Four ways to play",
        body: "Treasure Hunt, Manhunt, Checkpoint Domination and Smugglers game rules.",
      },
    ],
    fixes: [
      "Location sharing is consented and scoped to a match.",
      "Offline developer ideas support reviewed imports and exports.",
    ],
  },
];
const artifactSchema = z.object({
  platform: z.enum(["android", "ios", "web"]),
  variant: z.string(),
  url: z.url().startsWith("https://"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size: z.number().positive(),
  build: z.number().int().positive(),
  minOS: z.string().optional(),
});
export const releaseSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/),
  channel: z.enum(["stable", "beta"]),
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  complete: z.literal(true),
  critical: z.boolean().default(false),
  publishedAt: z.string().datetime(),
  highlights: z
    .array(z.object({ icon: z.string(), title: z.string(), body: z.string() }))
    .max(20),
  fixes: z.array(z.string()).max(100),
  artifacts: z.array(artifactSchema).min(1),
  releaseURL: z.url().startsWith("https://"),
});
export type Release = z.infer<typeof releaseSchema>;
export function newer(version: string, current = VERSION) {
  return newerVersion(version, current);
}
function available(release: Release) {
  return compatibleUpgrade(release, {
    version: VERSION,
    build: Number(BUILD),
    channel: build.channel,
    platform: Platform.OS,
    variant: build.variant,
  });
}
export async function checkUpdates(force = false): Promise<{
  message: string;
  release?: Release;
  at?: number;
  cached?: boolean;
}> {
  const endpoint = Constants.expoConfig?.extra?.updateManifest as
    string | undefined;
  if (typeof endpoint !== "string" || !endpoint)
    return {
      message:
        "Private development build. No authorized release endpoint is configured.",
    };
  if (!endpoint.startsWith("https://"))
    throw new Error("Update metadata requires HTTPS.");
  const previous = await read<{ at: number; etag?: string; release?: Release }>(
    "update-cache",
    { at: 0 },
  );
  if (!force && Date.now() - previous.at < 6 * 3600000)
    return {
      message: "Using the last successful check.",
      release:
        previous.release && available(previous.release)
          ? previous.release
          : undefined,
      at: previous.at,
      cached: true,
    };
  const response = await fetch(endpoint, {
    headers: previous.etag ? { "If-None-Match": previous.etag } : {},
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 304) {
    const at = Date.now();
    await write("update-cache", { ...previous, at });
    return {
      message: "No changes since your last check.",
      release:
        previous.release && available(previous.release)
          ? previous.release
          : undefined,
      at,
    };
  }
  if (!response.ok)
    throw new Error(
      `Release check failed (${response.status}). Last cached metadata was preserved.`,
    );
  const raw = await response.text();
  if (raw.length > 100000) throw new Error("Release metadata is too large.");
  const release = releaseSchema.parse(JSON.parse(raw));
  if (!validVersion(release.version))
    throw new Error("Invalid release version.");
  if (build.channel === "stable" && release.channel !== "stable")
    throw new Error("Beta metadata is incompatible with this stable build.");
  if (
    !release.artifacts.some(
      (a) => a.platform === Platform.OS && a.variant === build.variant,
    )
  )
    return {
      message:
        "No newer compatible artifact is available for this platform and distribution.",
    };
  const at = Date.now();
  await write("update-cache", {
    at,
    etag: response.headers.get("etag"),
    release,
  });
  return {
    message: available(release)
      ? `Version ${release.version} is available.`
      : "You have the latest compatible version.",
    release: available(release) ? release : undefined,
    at,
  };
}
