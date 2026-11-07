import { test } from "node:test";
import assert from "node:assert/strict";
import { compatibleUpgrade, newerVersion } from "@fieldplay/engine";
test("semantic release comparison handles numeric prereleases, stable promotion and metadata releases", () => {
  assert.ok(newerVersion("1.0.0-beta.10", "1.0.0-beta.2"));
  assert.ok(newerVersion("1.0.0", "1.0.0-beta.10"));
  assert.equal(newerVersion("sources-v1.0", "0.1.0"), false);
  assert.equal(newerVersion("0.0.9", "0.1.0"), false);
});
test("compatible upgrades require increasing build, correct variant/platform and allowed channel", () => {
  const current = {
    version: "0.1.0",
    build: 1,
    channel: "stable",
    platform: "android",
    variant: "private",
  };
  const candidate = {
    version: "0.1.0",
    channel: "stable" as const,
    artifacts: [{ platform: "android", variant: "private", build: 2 }],
  };
  assert.ok(compatibleUpgrade(candidate, current));
  assert.equal(
    compatibleUpgrade({ ...candidate, channel: "beta" }, current),
    false,
  );
  assert.equal(
    compatibleUpgrade(candidate, { ...current, variant: "store" }),
    false,
  );
  assert.equal(
    compatibleUpgrade(candidate, { ...current, platform: "ios" }),
    false,
  );
  assert.equal(compatibleUpgrade(candidate, { ...current, build: 2 }), false);
  assert.equal(
    compatibleUpgrade({ ...candidate, version: "0.0.9" }, current),
    false,
  );
});
