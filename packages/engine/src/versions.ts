// SPDX-License-Identifier: AGPL-3.0-only
import { valid, gt, gte, prerelease } from "semver";
export { valid as validVersion };
export function newerVersion(candidate: string, installed: string) {
  return !!valid(candidate) && !!valid(installed) && gt(candidate, installed);
}
export type ReleaseCandidate = {
  version: string;
  channel: "stable" | "beta";
  artifacts: { platform: string; variant: string; build: number }[];
};
export function compatibleUpgrade(
  candidate: ReleaseCandidate,
  installed: {
    version: string;
    build: number;
    channel: string;
    platform: string;
    variant: string;
  },
) {
  if (
    !valid(candidate.version) ||
    !valid(installed.version) ||
    !gte(candidate.version, installed.version)
  )
    return false;
  if (
    installed.channel === "stable" &&
    (candidate.channel !== "stable" || prerelease(candidate.version) !== null)
  )
    return false;
  return candidate.artifacts.some(
    (a) =>
      a.platform === installed.platform &&
      a.variant === installed.variant &&
      a.build > installed.build,
  );
}
