import { test } from "node:test";
import assert from "node:assert/strict";
import {
  changeIdea,
  exportIdeas,
  ideaExportSchema,
  mergeIdeas,
  newIdea,
  previewImport,
} from "@fieldplay/engine/ideas";
test("idea serialization preserves IDs, status history and implementation references", () => {
  const idea = { ...newIdea(), title: "A better clue" };
  const changed = changeIdea(idea, { status: "approved" });
  assert.equal(changed.id, idea.id);
  assert.equal(changed.history.length, 2);
  assert.equal(
    ideaExportSchema.parse(JSON.parse(JSON.stringify(exportIdeas([changed]))))
      .ideas[0].status,
    "approved",
  );
});
test("reviewed idea import deduplicates, preserves originals and only applies selected conflicts", () => {
  const a = { ...newIdea(), title: "A" },
    b = { ...newIdea(), title: "B" };
  const incoming = changeIdea(a, { description: "Incoming" });
  const p = previewImport([a], exportIdeas([incoming, b]));
  assert.equal(p.conflicts.length, 1);
  assert.equal(p.additions.length, 1);
  assert.equal(mergeIdeas([a], p)[0].description, "");
  assert.equal(mergeIdeas([a], p, [a.id])[0].description, "Incoming");
  assert.equal(previewImport([a], exportIdeas([a])).duplicates, 1);
  assert.throws(() =>
    previewImport([a], { ...exportIdeas([a]), schemaVersion: 999 }),
  );
  assert.throws(() =>
    previewImport([], { ...exportIdeas([a]), ideas: [a, a] }),
  );
});
