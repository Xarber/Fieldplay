// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "artifacts/release";
const files = await readdir(root);
const commit = process.env.BUILD_COMMIT,
  channel = process.env.RELEASE_CHANNEL,
  build = Number(process.env.BUILD_NUMBER);
if (
  !commit ||
  !/^[a-f0-9]{40}$/.test(commit) ||
  !["stable", "beta"].includes(channel ?? "") ||
  !Number.isSafeInteger(build) ||
  build <= 0
)
  throw new Error(
    "Explicit source commit, release channel and build number required.",
  );
const names = [
  /ios-unsigned\.ipa$/,
  /ios-simulator\.app\.zip$/,
  /android-universal\.apk$/,
  /android\.aab$/,
];
const artifacts = [];
for (const pattern of names) {
  const matches = files.filter((f) => pattern.test(f));
  if (matches.length !== 1)
    throw new Error(`Incomplete/ambiguous mandatory artifact: ${pattern}`);
  const name = matches[0],
    data = await readFile(`${root}/${name}`);
  if (data[0] !== 0x50 || data[1] !== 0x4b)
    throw new Error(`Invalid ZIP-based package: ${name}`);
  artifacts.push({
    name,
    size: (await stat(`${root}/${name}`)).size,
    sha256: createHash("sha256").update(data).digest("hex"),
    url: null,
  });
}
for (const name of [
  "ios-unsigned.json",
  "ios-simulator.json",
  "android-apk.json",
  "android-aab.json",
]) {
  const m = JSON.parse(await readFile(`${root}/${name}`, "utf8"));
  if (m.commit !== commit || m.channel !== channel || Number(m.build) !== build)
    throw new Error(`Artifact metadata mismatch: ${name}`);
}
const version = JSON.parse(
  await readFile("apps/mobile/package.json", "utf8"),
).version;
await writeFile(
  `${root}/SHA256SUMS`,
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join("\n") + "\n",
);
await writeFile(
  `${root}/release-candidate.json`,
  JSON.stringify(
    {
      schemaVersion: 1,
      version,
      build,
      commit,
      channel,
      stage: "validated-artifacts",
      published: false,
      artifacts,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  `${root}/RELEASE_NOTES.md`,
  `# Fieldplay ${version}\n\nPrivate release candidate. Not published.\n\nSource: ${commit}\nChannel: ${channel}\nBuild: ${build}\n\nSee CHANGELOG.md for reviewed behavior and docs/reports/VALIDATION.md for platform limits. Unsigned iOS IPAs require an external signing workflow. Simulator bundles are not device IPAs. Android AABs are not directly installable.\n`,
);
console.log(
  "Complete four-artifact collection validated. Publication remains disabled; no update URLs invented.",
);
