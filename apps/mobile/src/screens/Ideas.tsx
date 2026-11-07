// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from "react";
import { View, Image, Pressable } from "react-native";
import {
  changeIdea,
  exportIdeas,
  ideaCategories,
  ideaExportSchema,
  ideaSchema,
  ideaStatuses,
  ideasMarkdown,
  mergeIdeas,
  newIdea,
  previewImport,
  type Idea,
} from "@fieldplay/engine/ideas";
import {
  Badge,
  Button,
  Card,
  Disclosure,
  Field,
  Row,
  Txt,
  useTheme,
} from "../components/ui";
import { read, write } from "../services/storage";
import { exportFile, importJSON, pickScreenshot } from "../services/files";
import * as Clipboard from "expo-clipboard";
export default function Ideas({
  report,
}: {
  report: (message: string) => void;
}) {
  const t = useTheme();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Idea>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "priority">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<ReturnType<typeof previewImport>>();
  const [replace, setReplace] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    void read<unknown>("ideas", [])
      .then((v) => {
        const list = ideaExportSchema.shape.ideas.parse(v);
        setIdeas(list);
        setLoaded(true);
      })
      .catch((e) => report(e.message));
  }, []);
  const action = (fn: () => Promise<unknown>) => {
    void fn().catch((e) =>
      report(
        e instanceof Error ? e.message : "Could not complete idea action.",
      ),
    );
  };
  const persist = async (next: Idea[]) => {
    if (!loaded)
      throw new Error("Saved ideas must load successfully before editing.");
    ideaExportSchema.shape.ideas.parse(next);
    await write("ideas", next);
    setIdeas(next);
  };
  const save = () =>
    action(async () => {
      if (!draft) return;
      const parsed = ideaSchema.parse(draft);
      if (parsed.status === "implemented" && !parsed.implementation.trim())
        throw new Error(
          "Record the verification and implementation reference before marking an idea implemented.",
        );
      const exists = ideas.find((i) => i.id === parsed.id);
      const next = exists ? changeIdea(exists, parsed) : parsed;
      await persist(
        exists
          ? ideas.map((i) => (i.id === next.id ? next : i))
          : [...ideas, next],
      );
      setDraft(undefined);
      setNotice("Idea saved offline.");
    });
  const visible = ideas
    .filter(
      (i) =>
        (filter === "all" || i.status === filter) &&
        `${i.title} ${i.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "priority"
        ? ["high", "normal", "low"].indexOf(a.priority) -
          ["high", "normal", "low"].indexOf(b.priority)
        : sort === "newest"
          ? b.modifiedAt.localeCompare(a.modifiedAt)
          : a.createdAt.localeCompare(b.createdAt),
    );
  return (
    <View style={{ gap: 20 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View>
          <Txt size={28} weight="700">
            Developer ideas
          </Txt>
          <Txt size={13} color={t.muted}>
            Capture it now. Build it when you choose.
          </Txt>
        </View>
        <Button
          label="New idea"
          icon="plus"
          onPress={() => setDraft(newIdea())}
          disabled={!loaded}
        />
      </Row>
      <Row>
        <Button
          label="Export JSON"
          icon="upload"
          kind="secondary"
          onPress={() =>
            action(() =>
              exportFile(
                "Fieldplay-Ideas.json",
                JSON.stringify(exportIdeas(ideas), null, 2),
              ),
            )
          }
          disabled={!loaded}
        />
        <Button
          label="Export Markdown"
          kind="secondary"
          onPress={() =>
            action(() =>
              exportFile(
                "Fieldplay-Ideas.md",
                ideasMarkdown(ideas),
                "text/markdown",
              ),
            )
          }
          disabled={!loaded}
        />
        <Button
          label="Import ideas"
          icon="download"
          kind="secondary"
          onPress={() =>
            action(async () => {
              const raw = await importJSON();
              if (raw) {
                setPreview(previewImport(ideas, raw));
                setReplace([]);
              }
            })
          }
          disabled={!loaded}
        />
      </Row>
      {notice && <Txt color={t.lime}>{notice}</Txt>}
      {preview && (
        <Card>
          <Txt weight="700">Review import before applying</Txt>
          <Txt>
            {preview.additions.length} new · {preview.conflicts.length}{" "}
            conflicts · {preview.duplicates} unchanged
          </Txt>
          <Txt size={13} color={t.muted}>
            Existing ideas are preserved. Select any incoming versions you want
            to use.
          </Txt>
          {preview.conflicts.map((i) => (
            <Button
              key={i.id}
              label={`${replace.includes(i.id) ? "✓ " : ""}Use incoming: ${i.title}`}
              kind="secondary"
              onPress={() =>
                setReplace(
                  replace.includes(i.id)
                    ? replace.filter((x) => x !== i.id)
                    : [...replace, i.id],
                )
              }
            />
          ))}
          <Row>
            <Button
              label="Apply reviewed import"
              onPress={() =>
                action(async () => {
                  await persist(mergeIdeas(ideas, preview, replace));
                  setNotice(
                    "Import completed. Existing entries preserved unless selected.",
                  );
                  setPreview(undefined);
                })
              }
            />
            <Button
              label="Cancel import"
              kind="ghost"
              onPress={() => setPreview(undefined)}
            />
          </Row>
        </Card>
      )}
      {draft && (
        <Card>
          <Field
            label="Idea title"
            value={draft.title}
            onChangeText={(title) => setDraft({ ...draft, title })}
            maxLength={160}
          />
          <Field
            label="Description"
            value={draft.description}
            onChangeText={(description) => setDraft({ ...draft, description })}
            multiline
          />
          <Field
            label="Reproduction steps (optional)"
            value={draft.reproduction}
            onChangeText={(reproduction) =>
              setDraft({ ...draft, reproduction })
            }
            multiline
          />
          <Txt weight="600">Category</Txt>
          <Row>
            {ideaCategories.map((c) => (
              <Button
                key={c}
                label={`${draft.category === c ? "✓ " : ""}${c}`}
                kind="secondary"
                small
                onPress={() => setDraft({ ...draft, category: c })}
              />
            ))}
          </Row>
          <Txt weight="600">Status</Txt>
          <Row>
            {ideaStatuses.map((s) => (
              <Button
                key={s}
                label={`${draft.status === s ? "✓ " : ""}${s}`}
                kind="secondary"
                small
                onPress={() => setDraft({ ...draft, status: s })}
              />
            ))}
          </Row>
          <Row>
            {(["low", "normal", "high"] as const).map((p) => (
              <Button
                key={p}
                label={`${draft.priority === p ? "✓ " : ""}${p} priority`}
                kind="secondary"
                small
                onPress={() => setDraft({ ...draft, priority: p })}
              />
            ))}
          </Row>
          <Field
            label="Implementation and verification reference"
            value={draft.implementation}
            onChangeText={(implementation) =>
              setDraft({ ...draft, implementation })
            }
            multiline
          />
          <Field
            label="Changelog version or build"
            value={draft.release}
            onChangeText={(release) => setDraft({ ...draft, release })}
          />
          <Button
            label="Attach screenshot"
            kind="secondary"
            icon="image"
            onPress={() =>
              action(async () => {
                const screenshot = await pickScreenshot();
                if (screenshot) setDraft({ ...draft, screenshot });
              })
            }
          />
          {!!draft.screenshot && (
            <>
              <Image
                source={{ uri: draft.screenshot }}
                style={{ height: 150, width: "100%" }}
                resizeMode="contain"
                accessibilityLabel="Idea screenshot"
              />
              <Button
                label="Remove attachment"
                kind="ghost"
                onPress={() => setDraft({ ...draft, screenshot: "" })}
              />
            </>
          )}
          <Row>
            <Button label="Save idea" onPress={save} />
            <Button
              label="Cancel editing"
              kind="ghost"
              onPress={() => setDraft(undefined)}
            />
          </Row>
        </Card>
      )}
      <Field label="Search ideas" value={search} onChangeText={setSearch} />
      <Row>
        <Button
          label={filter === "all" ? "All statuses" : filter}
          kind="secondary"
          small
          onPress={() =>
            setFilter(
              filter === "all"
                ? ideaStatuses[0]
                : (ideaStatuses[
                    ideaStatuses.indexOf(
                      filter as (typeof ideaStatuses)[number],
                    ) + 1
                  ] ?? "all"),
            )
          }
        />
        <Button
          label={`Sort: ${sort}`}
          kind="secondary"
          small
          onPress={() =>
            setSort(
              sort === "newest"
                ? "oldest"
                : sort === "oldest"
                  ? "priority"
                  : "newest",
            )
          }
        />
        {selected.length > 0 && (
          <>
            <Button
              label={`Defer ${selected.length}`}
              kind="secondary"
              small
              onPress={() =>
                action(async () => {
                  await persist(
                    ideas.map((i) =>
                      selected.includes(i.id)
                        ? changeIdea(i, { status: "deferred" })
                        : i,
                    ),
                  );
                  setSelected([]);
                })
              }
            />
            <Button
              label={`Delete ${selected.length}`}
              kind="danger"
              small
              onPress={() => setDeleting(true)}
            />
          </>
        )}
      </Row>
      {deleting && (
        <Card>
          <Txt>
            Delete {selected.length} selected ideas? This permanently removes
            their local history.
          </Txt>
          <Row>
            <Button
              label="Confirm deletion"
              kind="danger"
              onPress={() =>
                action(async () => {
                  await persist(ideas.filter((i) => !selected.includes(i.id)));
                  setSelected([]);
                  setDeleting(false);
                })
              }
            />
            <Button
              label="Keep ideas"
              kind="secondary"
              onPress={() => setDeleting(false)}
            />
          </Row>
        </Card>
      )}
      {!visible.length && (
        <Card>
          <Txt weight="600">A clear space for your next thought.</Txt>
          <Txt color={t.muted}>
            Ideas stay on this device. Export a collection to share it with your
            development workspace.
          </Txt>
        </Card>
      )}
      {visible.map((i) => (
        <Card key={i.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`Select ${i.title}`}
              accessibilityState={{ checked: selected.includes(i.id) }}
              onPress={() =>
                setSelected(
                  selected.includes(i.id)
                    ? selected.filter((x) => x !== i.id)
                    : [...selected, i.id],
                )
              }
              style={{ minHeight: 44, justifyContent: "center", flex: 1 }}
            >
              <Txt size={18} weight="600">
                {selected.includes(i.id) ? "☑" : "□"} {i.title}
              </Txt>
            </Pressable>
            <Badge text={i.status} />
          </Row>
          <Txt size={13} color={t.muted}>
            {i.category} · {i.priority} ·{" "}
            {new Date(i.modifiedAt).toLocaleDateString()}
          </Txt>
          <Txt>{i.description}</Txt>
          <Disclosure title="Details and history">
            <Txt size={13}>{i.reproduction || "No reproduction steps."}</Txt>
            <Txt size={13}>
              {i.implementation || "No implementation reference."}
            </Txt>
            <Txt size={12}>Changelog: {i.release || "Not assigned"}</Txt>
            {i.history.map((h, j) => (
              <Txt key={j} size={12}>
                {h.at} · {h.status}
              </Txt>
            ))}
          </Disclosure>
          <Row>
            <Button
              label="Edit"
              small
              kind="secondary"
              onPress={() => setDraft(i)}
            />
            <Button
              label="Duplicate"
              small
              kind="ghost"
              onPress={() => {
                const fresh = newIdea();
                setDraft({
                  ...i,
                  id: fresh.id,
                  title: `${i.title} (copy)`,
                  status: "pending",
                  createdAt: fresh.createdAt,
                  modifiedAt: fresh.modifiedAt,
                  history: fresh.history,
                  implementation: "",
                  release: "",
                });
              }}
            />
            <Button
              label="Copy"
              small
              kind="ghost"
              onPress={() =>
                action(() => Clipboard.setStringAsync(ideasMarkdown([i])))
              }
            />
          </Row>
        </Card>
      ))}
    </View>
  );
}
