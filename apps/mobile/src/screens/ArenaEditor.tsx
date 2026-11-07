// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from "react";
import { View } from "react-native";
import * as Location from "expo-location";
import {
  configSchema,
  MODES,
  type Config,
  type Point,
} from "@fieldplay/engine";
import GameMap from "../components/GameMap";
import {
  Button,
  Card,
  Disclosure,
  Field,
  Row,
  Txt,
  useTheme,
} from "../components/ui";
import { exportFile, importJSON } from "../services/files";
import { read, write } from "../services/storage";
export default function ArenaEditor({
  initial,
  onSave,
  onClose,
  report,
}: {
  initial: Config;
  onSave: (c: Config) => void;
  onClose: () => void;
  report: (s: string) => void;
}) {
  const [draft, setDraft] = useState<Config>(structuredClone(initial));
  const [tool, setTool] = useState<
    "center" | "polygon" | "exclude" | "checkpoint"
  >("center");
  const [presets, setPresets] = useState<{ name: string; config: Config }[]>(
    [],
  );
  const [presetName, setPresetName] = useState("My outdoor game");
  const t = useTheme();
  const run = (fn: () => Promise<unknown>) => {
    void fn().catch((e) =>
      report(e instanceof Error ? e.message : "Invalid game setup."),
    );
  };
  const pick = (p: Point) => {
    if (tool === "center")
      setDraft({ ...draft, arena: { ...draft.arena, center: p } });
    else if (tool === "polygon")
      setDraft({
        ...draft,
        arena: {
          ...draft.arena,
          polygon: [...(draft.arena.polygon ?? []), p].slice(0, 40),
        },
      });
    else if (tool === "exclude")
      setDraft({
        ...draft,
        arena: {
          ...draft.arena,
          exclusions: [
            ...draft.arena.exclusions,
            { center: p, radius: 25 },
          ].slice(0, 20),
        },
      });
    else
      setDraft({
        ...draft,
        checkpoints: [...draft.checkpoints, p].slice(0, 8),
      });
  };
  const save = () => {
    try {
      onSave(configSchema.parse(draft));
      onClose();
    } catch (e) {
      report(e instanceof Error ? e.message : "Review the game rules.");
    }
  };
  return (
    <View style={{ gap: 18 }}>
      <Txt size={25} weight="700">
        Make this place your arena
      </Txt>
      <Txt size={13} color={t.muted}>
        Select an outdoor venue you know. Map data cannot certify safety. Avoid
        roads, restricted land, water and hazardous terrain.
      </Txt>
      <Row>
        {MODES.map((m) => (
          <Button
            key={m.id}
            label={`${draft.mode === m.id ? "✓ " : ""}${m.name}`}
            small
            kind="secondary"
            onPress={() => setDraft({ ...draft, mode: m.id })}
          />
        ))}
      </Row>
      <GameMap
        arena={draft.arena}
        onPick={pick}
        view={undefined}
        height={300}
      />
      <Txt size={12} color={t.muted}>
        Tap the map to place: {tool}. Start:{" "}
        {draft.arena.center.latitude.toFixed(5)},{" "}
        {draft.arena.center.longitude.toFixed(5)} (host selected).
      </Txt>
      <Row>
        {(["center", "polygon", "exclude", "checkpoint"] as const).map((s) => (
          <Button
            key={s}
            label={`${s === tool ? "✓ " : ""}${s}`}
            small
            kind="secondary"
            onPress={() => setTool(s)}
          />
        ))}
      </Row>
      <Row>
        <Button
          label="Center on my GPS"
          icon="crosshair"
          kind="secondary"
          onPress={() =>
            run(async () => {
              const p = await Location.requestForegroundPermissionsAsync();
              if (!p.granted)
                throw new Error(
                  "Location permission denied. You can select the arena manually.",
                );
              const fix = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              setDraft({
                ...draft,
                arena: {
                  ...draft.arena,
                  center: {
                    latitude: fix.coords.latitude,
                    longitude: fix.coords.longitude,
                  },
                },
              });
            })
          }
        />
        <Button
          label="Clear drawn areas"
          kind="ghost"
          onPress={() =>
            setDraft({
              ...draft,
              arena: { ...draft.arena, polygon: undefined, exclusions: [] },
              checkpoints: [],
            })
          }
        />
      </Row>
      <Row>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Field
            label="Arena radius (meters)"
            keyboardType="numeric"
            value={String(draft.arena.radius)}
            onChangeText={(v) =>
              setDraft({
                ...draft,
                arena: { ...draft.arena, radius: Number(v) },
              })
            }
          />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Field
            label="Duration (minutes)"
            keyboardType="numeric"
            value={String(draft.duration / 60)}
            onChangeText={(v) =>
              setDraft({ ...draft, duration: Number(v) * 60 })
            }
          />
        </View>
      </Row>
      <Row>
        <Button
          label={`Victory: ${draft.victory === "first" ? "First verified find" : "Highest points"}`}
          kind="secondary"
          onPress={() =>
            setDraft({
              ...draft,
              victory: draft.victory === "first" ? "points" : "first",
            })
          }
        />
        {draft.mode === "domination" && (
          <Button
            label={draft.movingHill ? "Moving hill" : "All checkpoints active"}
            kind="secondary"
            onPress={() =>
              setDraft({ ...draft, movingHill: !draft.movingHill })
            }
          />
        )}
      </Row>
      <Disclosure title="Advanced rules and discovery zones">
        <Field
          label="Enemy ping delay (seconds)"
          keyboardType="numeric"
          value={String(draft.pingDelay)}
          onChangeText={(s) => setDraft({ ...draft, pingDelay: Number(s) })}
        />
        <Field
          label="Enemy ping interval (seconds)"
          keyboardType="numeric"
          value={String(draft.pingInterval)}
          onChangeText={(s) => setDraft({ ...draft, pingInterval: Number(s) })}
        />
        <Field
          label="Interaction radius (meters, 5–50)"
          keyboardType="numeric"
          value={String(draft.interactionRadius)}
          onChangeText={(s) =>
            setDraft({ ...draft, interactionRadius: Number(s) })
          }
        />
        {draft.discovery.map((stage, i) => (
          <Row key={i}>
            <View style={{ flex: 1 }}>
              <Field
                label={`Stage ${i + 1}: after seconds`}
                keyboardType="numeric"
                value={String(stage.after)}
                onChangeText={(s) =>
                  setDraft({
                    ...draft,
                    discovery: draft.discovery.map((a, j) =>
                      i === j ? { ...a, after: Number(s) } : a,
                    ),
                  })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Search radius (m)"
                keyboardType="numeric"
                value={String(stage.radius)}
                onChangeText={(s) =>
                  setDraft({
                    ...draft,
                    discovery: draft.discovery.map((a, j) =>
                      i === j ? { ...a, radius: Number(s) } : a,
                    ),
                  })
                }
              />
            </View>
          </Row>
        ))}
        <Button
          label="Add discovery stage"
          small
          kind="secondary"
          onPress={() => {
            const last = draft.discovery.at(-1)!;
            setDraft({
              ...draft,
              discovery: [
                ...draft.discovery,
                {
                  after: last.after + 300,
                  radius: Math.max(10, last.radius - 10),
                },
              ],
            });
          }}
        />
      </Disclosure>
      <Disclosure title="Save, import and export presets">
        <Field
          label="Preset name"
          value={presetName}
          onChangeText={setPresetName}
        />
        <Row>
          <Button
            label="Save preset locally"
            small
            kind="secondary"
            onPress={() =>
              run(async () => {
                const c = configSchema.parse(draft);
                const existing = await read<{ name: string; config: Config }[]>(
                  "presets",
                  [],
                );
                const next = [
                  ...existing,
                  { name: presetName, config: c },
                ].slice(-30);
                await write("presets", next);
                setPresets(next);
              })
            }
          />
          <Button
            label="Load saved presets"
            small
            kind="secondary"
            onPress={() =>
              run(async () => setPresets(await read("presets", [])))
            }
          />
        </Row>
        {presets.map((p, i) => (
          <Button
            key={i}
            label={p.name}
            small
            kind="ghost"
            onPress={() => {
              try {
                setDraft(configSchema.parse(p.config));
              } catch {
                report("Saved preset is incompatible.");
              }
            }}
          />
        ))}
        <Row>
          <Button
            label="Export preset"
            small
            kind="secondary"
            onPress={() =>
              run(() =>
                exportFile(
                  "Fieldplay-preset.json",
                  JSON.stringify(configSchema.parse(draft), null, 2),
                ),
              )
            }
          />
          <Button
            label="Import preset"
            small
            kind="secondary"
            onPress={() =>
              run(async () => {
                const raw = await importJSON();
                if (raw) setDraft(configSchema.parse(raw));
              })
            }
          />
        </Row>
        <Txt size={12}>
          Imported rules are validated data. They cannot execute code. Saving
          resets treasure registration and readiness.
        </Txt>
      </Disclosure>
      <Row>
        <Button label="Save arena & rules" onPress={save} />
        <Button label="Cancel changes" kind="ghost" onPress={onClose} />
      </Row>
    </View>
  );
}
