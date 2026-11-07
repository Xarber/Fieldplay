// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from "react";
import {
  subscribeDownload,
  supportsInstaller,
  downloadUpdate,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  installUpdate,
  lastInstallStatus,
  type DownloadStatus,
} from "../services/install";
import { View, Linking, Switch } from "react-native";
import Constants from "expo-constants";
import commitMetadata from "../generated/commits.json";
const commits = commitMetadata as {
  id: string;
  message: string;
  date: string;
}[];
import {
  Badge,
  Button,
  Card,
  Disclosure,
  Field,
  Icon,
  Row,
  Txt,
  useTheme,
} from "../components/ui";
import {
  build,
  changelog,
  checkUpdates,
  type Release,
} from "../services/releases";
import { read, write } from "../services/storage";
import { exportFile } from "../services/files";
import Ideas from "./Ideas";
import type { Game } from "../hooks/useGame";
export default function Profile({
  name,
  setName,
  server,
  setServer,
  theme,
  setTheme,
  developer,
  game,
}: {
  name: string;
  setName: (s: string) => void;
  server: string;
  setServer: (s: string) => void;
  theme: string;
  setTheme: (s: "system" | "dark" | "light") => void;
  developer: { unlocked: boolean; tap: () => void; lock: () => void };
  game: Game;
}) {
  const t = useTheme();
  const [ideas, setIdeas] = useState(false);
  const [updates, setUpdates] = useState("Not checked");
  const [lastCheck, setLastCheck] = useState<number>();
  const [release, setRelease] = useState<Release>();
  const [auto, setAuto] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [history, setHistory] = useState<
    { at: number; winner: string; mode: string }[]
  >([]);
  const [friends, setFriends] = useState<{ name: string; note: string }[]>([]);
  const [friend, setFriend] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<DownloadStatus>({
    state: "idle",
    written: 0,
    total: 0,
    speed: 0,
    message: "",
  });
  const [installStatus, setInstallStatus] = useState("");
  useEffect(() => subscribeDownload(setDownload), []);
  const updateAction = (action: () => Promise<unknown>) => {
    void action().catch((e) =>
      game.report(e instanceof Error ? e.message : "Update action failed."),
    );
  };
  useEffect(() => {
    void read("automatic-updates", true)
      .then((enabled) => {
        setAuto(enabled);
        if (enabled)
          return checkUpdates().then((r) => {
            setUpdates(r.message);
            setRelease(r.release);
            setLastCheck(r.at);
          });
      })
      .catch((e) => setUpdates(e.message));
    void read("wifi-only-updates", true)
      .then(setWifiOnly)
      .catch((e) => game.report(e.message));
    void read<typeof history>("history", [])
      .then(setHistory)
      .catch((e) => game.report(e.message));
    void read<typeof friends>("friends", [])
      .then(setFriends)
      .catch((e) => game.report(e.message));
  }, []);
  const check = () => {
    setBusy(true);
    void checkUpdates(true)
      .then((r) => {
        setUpdates(r.message);
        setRelease(r.release);
        setLastCheck(r.at);
      })
      .catch((e) => setUpdates(e.message))
      .finally(() => setBusy(false));
  };
  if (ideas && developer.unlocked)
    return (
      <View style={{ gap: 18 }}>
        <Button
          label="Back to developer options"
          icon="arrow-left"
          kind="ghost"
          onPress={() => setIdeas(false)}
        />
        <Ideas report={game.report} />
      </View>
    );
  return (
    <View style={{ gap: 22 }}>
      <View>
        <Txt size={32} weight="700">
          Your corner of the field.
        </Txt>
        <Txt color={t.muted}>
          A name, your people, and everything behind the scenes.
        </Txt>
      </View>
      <Card>
        <Row>
          <View
            style={{
              backgroundColor: t.accent,
              height: 64,
              width: 64,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Txt size={25} weight="700" color="#FFF">
              {name.slice(0, 2).toUpperCase() || "FP"}
            </Txt>
          </View>
          <View>
            <Txt size={23} weight="700">
              {name || "Explorer"}
            </Txt>
            <Badge text="PRIVATE GUEST PROFILE" />
          </View>
        </Row>
        <Field
          label="Player name"
          value={name}
          maxLength={32}
          onChangeText={setName}
        />
        <Txt size={12} color={t.muted}>
          Your local profile works without an account. Joining a party creates a
          scoped six-hour guest session; this is not a permanent online
          identity.
        </Txt>
      </Card>
      <Card>
        <Txt size={21} weight="700">
          Your people
        </Txt>
        <Txt size={13} color={t.muted}>
          A private address book on this device. No public player search or
          automatic location sharing.
        </Txt>
        {friends.map((f, i) => (
          <Row key={i} style={{ justifyContent: "space-between" }}>
            <View>
              <Txt weight="600">{f.name}</Txt>
              <Txt size={12} color={t.muted}>
                {f.note}
              </Txt>
            </View>
            <Button
              label={`Remove ${f.name}`}
              kind="ghost"
              small
              onPress={() => {
                const next = friends.filter((_, j) => j !== i);
                void write("friends", next)
                  .then(() => setFriends(next))
                  .catch((e) => game.report(e.message));
              }}
            />
          </Row>
        ))}
        <Field label="Friend’s name" value={friend} onChangeText={setFriend} />
        <Field
          label="Contact note (optional)"
          value={notes}
          onChangeText={setNotes}
        />
        <Button
          label="Add to my people"
          icon="user-plus"
          kind="secondary"
          onPress={() => {
            if (!friend.trim()) return;
            const next = [
              ...friends,
              { name: friend.trim().slice(0, 40), note: notes.slice(0, 150) },
            ].slice(-100);
            void write("friends", next)
              .then(() => {
                setFriends(next);
                setFriend("");
                setNotes("");
              })
              .catch((e) => game.report(e.message));
          }}
        />
      </Card>
      <Card>
        <Txt size={21} weight="700">
          Settings
        </Txt>
        <Txt size={13} color={t.muted}>
          Appearance
        </Txt>
        <Row>
          {(["system", "dark", "light"] as const).map((s) => (
            <Button
              key={s}
              label={`${theme === s ? "✓ " : ""}${s}`}
              kind="secondary"
              small
              onPress={() => setTheme(s)}
            />
          ))}
        </Row>
        <Field
          label="Private game server"
          value={server}
          onChangeText={setServer}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="wss://your-private-server.example"
        />
        <Disclosure title="Connecting devices and location privacy">
          Use your own HTTPS/WSS host, including a trusted private LAN host. On
          this computer only, ws://localhost:8787 works for development. No GPS
          is transmitted just by opening this app. A foreground match can use
          GPS after separate consent. Background tracking is not enabled; a
          match pauses when the app leaves the foreground. Server or host
          restart loses active match state safely.
        </Disclosure>
      </Card>
      <Card>
        <Row>
          <Icon name="download-cloud" />
          <Txt size={21} weight="700">
            Updates
          </Txt>
        </Row>
        <Txt>
          Version {build.version} · build {build.build} · {build.channel}
        </Txt>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt>Automatic update checks</Txt>
          <Switch
            accessibilityLabel="Automatic update checks"
            value={auto}
            onValueChange={(v) => {
              setAuto(v);
              void write("automatic-updates", v);
            }}
          />
        </Row>
        {supportsInstaller() && (
          <Row style={{ justifyContent: "space-between" }}>
            <Txt>Wi-Fi-only update downloads</Txt>
            <Switch
              accessibilityLabel="Wi-Fi-only update downloads"
              value={wifiOnly}
              onValueChange={(v) => {
                setWifiOnly(v);
                void write("wifi-only-updates", v);
              }}
            />
          </Row>
        )}
        <Txt size={13} color={t.muted}>
          {updates}
        </Txt>
        <Txt size={12} color={t.muted}>
          Last successful check:{" "}
          {lastCheck
            ? new Date(lastCheck).toLocaleString()
            : "No successful network check"}
        </Txt>
        <Button
          label={busy ? "Checking…" : "Check for Updates"}
          icon="refresh-cw"
          kind="secondary"
          disabled={busy}
          onPress={check}
        />
        {release && (
          <>
            <Badge
              text={
                release.critical
                  ? "SECURITY UPDATE"
                  : `NEW · ${release.version}`
              }
            />
            {release.highlights.map((h, i) => (
              <View key={i}>
                <Txt weight="600">◇ {h.title}</Txt>
                <Txt size={13} color={t.muted}>
                  {h.body}
                </Txt>
              </View>
            ))}
            <Txt weight="600">Fixes & Improvements</Txt>
            {release.fixes.map((f, i) => (
              <Txt key={i} size={13}>
                • {f}
              </Txt>
            ))}
            {supportsInstaller() && (
              <Button
                label="Download & update now"
                disabled={
                  download.state === "downloading" ||
                  download.state === "installing"
                }
                onPress={() => updateAction(() => downloadUpdate(release))}
              />
            )}
            <Button
              label="View release & installation requirements"
              kind="secondary"
              onPress={() => {
                void Linking.openURL(release.releaseURL);
              }}
            />
            <Txt size={12} color={t.muted}>
              Android private builds verify downloaded APKs before opening the
              official system installation flow. iOS requires a supported
              signing or store workflow. Installation on physical devices has
              not been verified.
            </Txt>
          </>
        )}
        {!!download.message && (
          <View style={{ gap: 12 }}>
            <Txt size={13}>{download.message}</Txt>
            {download.total > 0 && (
              <Txt size={12}>
                {(download.written / 1000000).toFixed(1)} /{" "}
                {(download.total / 1000000).toFixed(1)} MB ·{" "}
                {(download.speed / 1000000).toFixed(2)} MB/s
                {download.speed > 0
                  ? ` · about ${Math.ceil((download.total - download.written) / download.speed)} seconds left`
                  : ""}
              </Txt>
            )}
            <Row>
              {download.state === "downloading" && (
                <Button
                  label="Pause download"
                  small
                  kind="secondary"
                  onPress={() => updateAction(pauseDownload)}
                />
              )}
              {download.state === "paused" && (
                <Button
                  label="Resume download"
                  small
                  kind="secondary"
                  onPress={() => updateAction(resumeDownload)}
                />
              )}
              {download.state === "downloaded" && (
                <Button
                  label="Install downloaded update"
                  small
                  onPress={() => updateAction(installUpdate)}
                />
              )}
              <Button
                label="Cancel download"
                small
                kind="ghost"
                onPress={cancelDownload}
              />
            </Row>
          </View>
        )}
        {supportsInstaller() && (
          <>
            <Button
              label="Read Android installation result"
              small
              kind="ghost"
              onPress={() =>
                updateAction(async () =>
                  setInstallStatus(await lastInstallStatus()),
                )
              }
            />
            <Txt size={12} color={t.muted}>
              {installStatus}
            </Txt>
          </>
        )}
      </Card>
      <Card>
        <Txt size={22} weight="700">
          What’s new
        </Txt>
        {changelog.map((r) => (
          <View key={r.version} style={{ gap: 13 }}>
            <Row>
              <Txt weight="700">{r.version}</Txt>
              <Badge
                text={r.published ? "RELEASED" : "DEVELOPMENT · UNRELEASED"}
              />
              <Txt size={12} color={t.muted}>
                {r.date}
              </Txt>
            </Row>
            {r.highlights.map((h, i) => (
              <Row key={i} style={{ alignItems: "flex-start" }}>
                <Icon name={h.icon as "compass"} color={t.lime} />
                <View style={{ flex: 1 }}>
                  <Txt weight="600">{h.title}</Txt>
                  <Txt size={13} color={t.muted}>
                    {h.body}
                  </Txt>
                </View>
              </Row>
            ))}
            <Disclosure title="Fixes & Improvements">
              {r.fixes.map((f, i) => (
                <Txt key={i} size={13}>
                  • {f}
                </Txt>
              ))}
            </Disclosure>
          </View>
        ))}
      </Card>
      <Disclosure title="Recent match results">
        {history.length ? (
          history.map((h, i) => (
            <Txt key={i} size={13}>
              {new Date(h.at).toLocaleString()} · {h.mode} · {h.winner}
            </Txt>
          ))
        ) : (
          <Txt size={13}>
            Results from completed matches appear here. No movement histories
            are saved.
          </Txt>
        )}
      </Disclosure>
      <Card>
        <Button
          label={`Fieldplay ${build.version} (${build.build})`}
          kind="ghost"
          onPress={developer.tap}
        />
        <Button
          label="Source code (AGPL-3.0)"
          icon="code"
          kind="ghost"
          onPress={() => {
            void Linking.openURL(process.env.EXPO_PUBLIC_SOURCE_URL??"https://github.com/Xarber/Fieldplay");
          }}
        />
        <Txt size={11} color={t.muted}>
          Independent OpenRecode project · AGPL-3.0-only{`\n`}No ads. No
          permanent location tracking.
        </Txt>
        {developer.unlocked && (
          <>
            <Badge text="DEVELOPER OPTIONS" />
            <Txt size={13}>
              Engine 1 · {game.status.transport} · {game.status.connection}
              {`\n`}Peer channels: {game.status.peers}
              {`\n`}Authority: {game.credentials?.authority ?? "None"}
              {`\n`}Host: {game.view?.hostId ?? "None"}
              {`\n`}Mode: {game.view?.config.mode ?? "None"} · state:{" "}
              {game.view?.phase ?? "None"}
              {`\n`}
              {game.gps}
              {`\n`}Map provider: MapLibre / OpenFreeMap{`\n`}Build commit:{" "}
              {build.commit}
              {`\n`}Build date: {build.date ?? "Not embedded"}
              {`\n`}Packet loss: not measured
            </Txt>
            <Txt size={13}>
              Peer path: {game.status.path ?? "not measured"} · measured RTT:{" "}
              {game.status.latencyMs === undefined
                ? "not measured"
                : `${game.status.latencyMs} ms`}
            </Txt>
            <Disclosure title="Developer changelog">
              {commits.length ? (
                commits.map((c) => (
                  <View key={c.id}>
                    <Txt size={12} weight="600">
                      {c.message}
                    </Txt>
                    <Txt size={11} color={t.muted}>
                      {c.id} · {c.date} · {build.channel}
                    </Txt>
                  </View>
                ))
              ) : (
                <Txt size={12}>
                  Commit metadata is generated from the checkout during builds.
                </Txt>
              )}
            </Disclosure>
            <Button
              label="Developer Ideas"
              icon="edit-3"
              onPress={() => setIdeas(true)}
            />
            <Button
              label="Export sanitized diagnostics"
              kind="secondary"
              onPress={() => {
                void exportFile(
                  "Fieldplay-diagnostics.json",
                  JSON.stringify(
                    {
                      build,
                      status: game.status,
                      phase: game.view?.phase,
                      mode: game.view?.config.mode,
                      revision: game.view?.revision,
                      gpsPermission: game.self?.consent
                        ? "consented"
                        : "not-sharing",
                      map: "MapLibre",
                      platform: Constants.platform,
                    },
                    null,
                    2,
                  ),
                ).catch((e) => game.report(e.message));
              }}
            />
            <Button
              label="Lock developer options"
              kind="ghost"
              onPress={developer.lock}
            />
          </>
        )}
        <Txt size={10} color={t.muted}>
          {build.version} · {build.commit}
        </Txt>
      </Card>
    </View>
  );
}
