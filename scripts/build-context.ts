// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
let commits: { id: string; message: string; date: string }[] = [];
try {
  const ids = execFileSync("git", ["rev-list", "-30", "HEAD"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  commits = ids.filter(Boolean).map((id) => ({
    id,
    message: execFileSync("git", ["show", "-s", "--format=%B", id], {
      encoding: "utf8",
    }).trim(),
    date: execFileSync("git", ["show", "-s", "--format=%cI", id], {
      encoding: "utf8",
    }).trim(),
  }));
} catch {
  /* Initial checkout may not have Git metadata. Never invent a commit. */
}
await mkdir("apps/mobile/src/generated", { recursive: true });
await writeFile(
  "apps/mobile/src/generated/commits.json",
  JSON.stringify(commits, null, 2) + "\n",
);
