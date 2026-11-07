// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  useColorScheme,
  Platform,
  AppState,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { MODES, defaultConfig, type Mode } from "@fieldplay/engine";
import {
  ThemeProvider,
  dark,
  light,
  Icon,
  Txt,
  Button,
  Card,
  Field,
  Row,
  Badge,
  Disclosure,
  type IconName,
} from "../src/components/ui";
import Home, { ModeCard } from "../src/screens/Home";
import Party from "../src/screens/Party";
import Profile from "../src/screens/Profile";
import Scanner from "../src/components/Scanner";
import GlassSurface from "../src/components/GlassSurface";
import Sheet from "../src/components/Sheet";
import { useGame, type RecentParty } from "../src/hooks/useGame";
import { useDeveloper } from "../src/hooks/useDeveloper";
import { read, write } from "../src/services/storage";
import {
  build,
  changelog,
  checkUpdates,
  type Release,
} from "../src/services/releases";
const initialServer =
  Platform.OS === "web" && typeof location !== "undefined"
    ? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`
    : (process.env.EXPO_PUBLIC_SIGNAL_URL ?? "ws://localhost:8787");
type Tab = "Play" | "Games" | "Groups" | "Profile";
const nav: { name: Tab; icon: IconName }[] = [
  { name: "Play", icon: "compass" },
  { name: "Games", icon: "grid" },
  { name: "Groups", icon: "users" },
  { name: "Profile", icon: "user" },
];
export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>("Play");
  const [name, setName] = useState("Explorer");
  const [server, setServer] = useState(initialServer);
  const [theme, setTheme] = useState<"system" | "dark" | "light">("dark");
  const [loaded, setLoaded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sheet, setSheet] = useState<
    "host" | "join" | "how" | "scanner" | "whatsnew" | undefined
  >();
  const [authority, setAuthority] = useState<"peer" | "dedicated">("peer");
  const [relayOnly, setRelayOnly] = useState(false);
  const [partyName, setPartyName] = useState("Weekend explorers");
  const [selectedMode, setSelectedMode] = useState<Mode>("treasure");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [webUpdate, setWebUpdate] = useState<ServiceWorkerRegistration>();
  const [availableUpdate, setAvailableUpdate] = useState<Release>();
  const pendingMode = useRef<Mode | undefined>(undefined);
  const width = useWindowDimensions().width;
  const wide = width >= 960;
  const system = useColorScheme();
  const t =
    theme === "light" || (theme === "system" && system === "light")
      ? light
      : dark;
  const developer = useDeveloper(tab);
  const url = Linking.useURL();
  useEffect(() => {
    void Promise.all([
      read("profile", {
        name: "Explorer",
        server: initialServer,
        theme: "dark" as typeof theme,
      }),
      read<string[]>("favorites", []),
      read<string | undefined>("last-version", undefined),
    ])
      .then(([p, f, last]) => {
        setName(p.name);
        setServer(p.server);
        setTheme(p.theme);
        setFavorites(f);
        setLoaded(true);
        if (last && last !== build.version) setSheet("whatsnew");
        void write("last-version", build.version);
      })
      .catch((e) => game.report(e.message));
  }, []);
  useEffect(() => {
    if (loaded)
      void write("profile", { name, server, theme }).catch((e) =>
        game.report(e.message),
      );
  }, [name, server, theme, loaded]);
  useEffect(() => {
    if (url) {
      try {
        const link = new URL(url);
        const c = link.searchParams.get("code"),
          s = link.searchParams.get("server");
        if (c) {
          setCode(c);
          if (s) setServer(s);
          setSheet("join");
        }
      } catch {
        /* Invalid links do not connect. */
      }
    }
  }, [url]);
  useEffect(() => {
    if (
      game.view?.phase === "lobby" &&
      pendingMode.current &&
      game.credentials?.id === game.view.hostId
    ) {
      const mode = pendingMode.current;
      pendingMode.current = undefined;
      game.send({ type: "configure", config: { ...game.view.config, mode } });
    }
  }, [game.view, game.credentials]);
  useEffect(() => {
    if (Platform.OS !== "web" || __DEV__ || !("serviceWorker" in navigator))
      return;
    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.waiting) setWebUpdate(reg);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller)
              setWebUpdate(reg);
          });
        });
      })
      .catch(() =>
        game.report(
          "Offline support could not start. Check this browser’s storage permissions.",
        ),
      );
  }, []);
  useEffect(() => {
    const check = () => {
      void read("automatic-updates", true)
        .then((enabled) => {
          if (enabled)
            return checkUpdates().then((r) => setAvailableUpdate(r.release));
        })
        .catch(() => {
          /* Manual settings check displays detailed errors. */
        });
    };
    check();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") check();
    });
    return () => sub.remove();
  }, []);
  const host = (mode: Mode = "treasure") => {
    setSelectedMode(mode);
    setSheet("host");
  };
  const join = () => setSheet("join");
  const joinRecent = (p: RecentParty) => {
    setCode(p.code);
    setServer(p.server);
    setSheet("join");
  };
  const toggle = (m: Mode) => {
    const next = favorites.includes(m)
      ? favorites.filter((x) => x !== m)
      : [...favorites, m];
    setFavorites(next);
    void write("favorites", next);
  };
  const enter = async (operation: "create" | "join") => {
    try {
      if (game.view)
        throw new Error("Leave your current party before joining another.");
      if (!name.trim()) throw new Error("Choose your player name.");
      setBusy(true);
      let invite = code.trim(),
        target = server;
      if (operation === "join" && invite.includes("://")) {
        const link = new URL(invite);
        invite = link.searchParams.get("code") ?? "";
        target = link.searchParams.get("server") ?? server;
        setServer(target);
      }
      if (operation === "join" && !/^[a-f0-9]{32}$/.test(invite))
        throw new Error("Paste the complete private invite code or link.");
      pendingMode.current = operation === "create" ? selectedMode : undefined;
      await game.connect({
        server: target,
        name: name.trim(),
        operation,
        code: invite,
        authority,
        relayOnly,
        partyName,
      });
      setTab("Groups");
      setSheet(undefined);
    } catch (e) {
      game.report(e instanceof Error ? e.message : "Could not join party.");
    } finally {
      setBusy(false);
    }
  };
  const navigation = (compact: boolean) => (
    <View
      style={{
        flexDirection: compact ? "row" : "column",
        gap: compact ? 4 : 8,
        ...(compact
          ? { justifyContent: "space-around", paddingVertical: 7 }
          : {}),
      }}
    >
      {nav.map((n) => (
        <Pressable
          key={n.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === n.name }}
          accessibilityLabel={n.name}
          onPress={() => setTab(n.name)}
          style={({ pressed }) => ({
            flexDirection: compact ? "column" : "row",
            alignItems: "center",
            gap: compact ? 5 : 14,
            paddingHorizontal: compact ? 16 : 18,
            paddingVertical: compact ? 8 : 15,
            borderRadius: 13,
            backgroundColor: tab === n.name ? t.raised : "transparent",
            opacity: pressed ? 0.65 : 1,
            ...(!compact
              ? {
                  borderLeftWidth: 3,
                  borderLeftColor: tab === n.name ? t.accent : "transparent",
                }
              : {}),
          })}
        >
          <Icon
            name={n.icon}
            size={compact ? 20 : 19}
            color={tab === n.name ? t.text : t.muted}
          />
          <Txt
            size={compact ? 10 : 14}
            color={tab === n.name ? t.text : t.muted}
            weight={tab === n.name ? "600" : "400"}
          >
            {n.name}
          </Txt>
          {n.name === "Groups" && game.view && !compact && (
            <View
              style={{
                height: 7,
                width: 7,
                borderRadius: 7,
                backgroundColor: t.lime,
                marginLeft: "auto",
              }}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
  const brand = (
    <Row style={{ gap: 10 }}>
      <View
        style={{
          width: 35,
          height: 35,
          borderRadius: 11,
          backgroundColor: t.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="flag" size={20} color="#FFF" />
      </View>
      <Txt size={25} weight="700" style={{ letterSpacing: -1 }}>
        fieldplay
        <Txt size={25} color={t.lime}>
          .
        </Txt>
      </Txt>
    </Row>
  );
  return (
    <ThemeProvider value={t}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: t.bg }}
        edges={["top", "bottom"]}
      >
        <StatusBar style={t === dark ? "light" : "dark"} />
        <View style={{ flex: 1, flexDirection: "row" }}>
          {wide && (
            <View
              style={{
                width: 230,
                borderRightWidth: 1,
                borderRightColor: t.line,
                padding: 22,
                paddingTop: 35,
                gap: 45,
              }}
            >
              {brand}
              {navigation(false)}
              <View style={{ marginTop: "auto", gap: 20 }}>
                <Card
                  style={{ padding: 16, backgroundColor: t.raised, gap: 10 }}
                >
                  <Icon name="sun" color={t.lime} />
                  <Txt size={14} weight="600">
                    Take play outside.
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    A familiar place can hold a whole new adventure.
                  </Txt>
                  <Button
                    label="How to play"
                    kind="ghost"
                    small
                    onPress={() => setSheet("how")}
                  />
                </Card>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTab("Profile")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 50,
                  }}
                >
                  <View
                    style={{
                      height: 35,
                      width: 35,
                      borderRadius: 12,
                      backgroundColor: "#434667",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Txt color="#FFF" weight="600" size={12}>
                      {name.slice(0, 2).toUpperCase()}
                    </Txt>
                  </View>
                  <View>
                    <Txt size={13} weight="600">
                      {name || "Explorer"}
                    </Txt>
                    <Txt size={11} color={t.muted}>
                      Your private profile
                    </Txt>
                  </View>
                  <Icon name="chevrons-right" size={14} color={t.muted} />
                </Pressable>
              </View>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Row
              style={{
                justifyContent: "space-between",
                paddingHorizontal: wide ? 42 : 20,
                paddingVertical: wide ? 22 : 15,
                borderBottomWidth: 1,
                borderBottomColor: t.line,
              }}
            >
              {wide ? (
                <Row style={{ gap: 8 }}>
                  <Txt size={13} color={t.muted}>
                    Your playground
                  </Txt>
                  <Icon name="chevron-right" size={14} color={t.muted} />
                  <Txt size={13}>{tab}</Txt>
                </Row>
              ) : (
                brand
              )}
              <Row>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 6,
                    backgroundColor:
                      game.status.connection === "connected" ? t.lime : t.muted,
                  }}
                />
                <Txt size={11} color={t.muted}>
                  {game.status.connection === "connected"
                    ? "PRIVATE PARTY"
                    : "LET’S GET OUTSIDE"}
                </Txt>
                {wide && (
                  <Button
                    label="Join game"
                    small
                    kind="secondary"
                    icon="log-in"
                    onPress={join}
                  />
                )}
              </Row>
            </Row>
            {game.error && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                accessibilityLiveRegion="polite"
                onPress={() => game.setError("")}
                style={{
                  padding: 14,
                  backgroundColor: t.raised,
                  borderBottomColor: t.line,
                  borderBottomWidth: 1,
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <Icon name="info" color={t.lime} />
                <Txt size={13} style={{ flex: 1 }}>
                  {game.error}
                </Txt>
                <Icon name="x" size={16} />
              </Pressable>
            )}
            {availableUpdate && (
              <View style={{ padding: 15, gap: 10, backgroundColor: t.raised }}>
                <Txt weight="600">
                  {availableUpdate.critical
                    ? "Security update"
                    : "New adventure ahead"}{" "}
                  · {availableUpdate.version}
                </Txt>
                <Txt size={13}>
                  {availableUpdate.highlights[0]?.title ??
                    "Fixes & Improvements"}
                </Txt>
                <Row>
                  <Button
                    label="Review update & release notes"
                    small
                    onPress={() => setTab("Profile")}
                  />
                  <Button
                    label="Later"
                    small
                    kind="ghost"
                    onPress={() => setAvailableUpdate(undefined)}
                  />
                </Row>
              </View>
            )}
            {webUpdate && (
              <View style={{ padding: 15, gap: 12, backgroundColor: t.raised }}>
                <Txt weight="600">A fresh version of Fieldplay is ready.</Txt>
                <Txt size={13}>
                  Review What’s New in Profile. Finish or leave your game and
                  save any edits before reloading.
                </Txt>
                <Row>
                  <Button
                    label="Review What’s New"
                    small
                    kind="secondary"
                    onPress={() => {
                      setTab("Profile");
                      setSheet("whatsnew");
                    }}
                  />
                  <Button
                    label="Update & reload"
                    small
                    disabled={!!game.view && game.view.phase !== "finished"}
                    onPress={() => {
                      webUpdate.waiting?.postMessage({ type: "SKIP_WAITING" });
                      navigator.serviceWorker.addEventListener(
                        "controllerchange",
                        () => location.reload(),
                        { once: true },
                      );
                    }}
                  />
                </Row>
              </View>
            )}
            <ScrollView
              key={tab}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: wide ? 42 : 20,
                paddingTop: wide ? 33 : 24,
                paddingBottom: 45,
                gap: 25,
                maxWidth: 1500,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {tab === "Play" ? (
                <Home
                  host={host}
                  join={join}
                  games={() => setTab("Games")}
                  info={() => setSheet("how")}
                  recent={game.recent}
                  joinRecent={joinRecent}
                  favorites={favorites}
                  toggleFavorite={toggle}
                />
              ) : tab === "Games" ? (
                <View style={{ gap: 26 }}>
                  <Txt size={36} weight="700">
                    One map. So many possibilities.
                  </Txt>
                  <Txt color={t.muted}>
                    Four adventures built around the world outside.
                  </Txt>
                  <Field
                    label="Find a game"
                    placeholder="Treasure, stealth, territory…"
                    value={search}
                    onChangeText={setSearch}
                  />
                  <Row>
                    <Button
                      label={onlyFavorites ? "✓ Favorites" : "Favorites"}
                      icon="heart"
                      kind="secondary"
                      small
                      onPress={() => setOnlyFavorites(!onlyFavorites)}
                    />
                    <Button
                      label="All games"
                      kind="ghost"
                      small
                      onPress={() => {
                        setOnlyFavorites(false);
                        setSearch("");
                      }}
                    />
                  </Row>
                  <Row style={{ alignItems: "stretch", gap: 20 }}>
                    {MODES.filter(
                      (m) =>
                        (!onlyFavorites || favorites.includes(m.id)) &&
                        `${m.name} ${m.tags} ${m.description}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    ).map((m) => (
                      <ModeCard
                        key={m.id}
                        mode={m}
                        onPlay={() => host(m.id)}
                        favorite={favorites.includes(m.id)}
                        onFavorite={() => toggle(m.id)}
                      />
                    ))}
                  </Row>
                  <Disclosure title="More adventures on the horizon">
                    <Txt size={13}>
                      Hide and Seek, Sardines, Jailbreak, Infection, Freeze Tag,
                      Fugitive, Capture the Flag, secret ranks, hidden bases,
                      puzzle relays, photo hunts, dead drops, social deduction,
                      Firefly Hunt and Beacon Heist are planned game families.
                      They are not playable modes in this development build.
                    </Txt>
                  </Disclosure>
                </View>
              ) : tab === "Groups" ? (
                <Party
                  game={game}
                  server={server}
                  openHost={() => host()}
                  openJoin={join}
                />
              ) : (
                <Profile
                  name={name}
                  setName={setName}
                  server={server}
                  setServer={setServer}
                  theme={theme}
                  setTheme={setTheme}
                  developer={developer}
                  game={game}
                />
              )}
            </ScrollView>
            {!wide && (
              <GlassSurface
                style={{
                  borderTopWidth: 1,
                  borderTopColor: t.line,
                  backgroundColor: t.panel,
                }}
              >
                {navigation(true)}
              </GlassSurface>
            )}
          </View>
        </View>
        <Sheet
          visible={!!sheet}
          title={
            sheet === "host"
              ? "Start something outside"
              : sheet === "join"
                ? "Your friends are waiting"
                : sheet === "how"
                  ? "A world worth playing in"
                  : sheet === "whatsnew"
                    ? "What’s new in Fieldplay"
                    : "Scan invitation"
          }
          onClose={() => setSheet(undefined)}
        >
          {(sheet === "host" || sheet === "join") && (
            <>
              <Txt color={t.muted}>
                {sheet === "host"
                  ? "Choose an adventure, bring your people, and make the playing field yours."
                  : "Paste an invitation from someone you know. Location sharing stays off until you accept the game rules."}
              </Txt>
              <Field
                label="Your player name"
                value={name}
                onChangeText={setName}
                maxLength={32}
              />
              <Row style={{ justifyContent: "space-between" }}>
                <Txt size={13}>Relay-only peer privacy (requires TURN)</Txt>
                <Switch
                  accessibilityLabel="Relay-only peer privacy"
                  value={relayOnly}
                  onValueChange={setRelayOnly}
                />
              </Row>
              <Field
                label="Private server address"
                value={server}
                onChangeText={setServer}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {sheet === "host" ? (
                <>
                  <Field
                    label="Party name"
                    value={partyName}
                    onChangeText={setPartyName}
                    maxLength={60}
                  />
                  <Txt size={13} weight="600">
                    Choose your game
                  </Txt>
                  <Row>
                    {MODES.map((m) => (
                      <Button
                        key={m.id}
                        label={`${selectedMode === m.id ? "✓ " : ""}${m.name}`}
                        kind="secondary"
                        small
                        onPress={() => setSelectedMode(m.id)}
                      />
                    ))}
                  </Row>
                  <Row>
                    <Button
                      label={`${authority === "peer" ? "✓ " : ""}Player-hosted P2P`}
                      kind="secondary"
                      small
                      onPress={() => setAuthority("peer")}
                    />
                    <Button
                      label={`${authority === "dedicated" ? "✓ " : ""}Dedicated authority`}
                      kind="secondary"
                      small
                      onPress={() => setAuthority("dedicated")}
                    />
                  </Row>
                  <Disclosure title="Which connection should I use?">
                    Player-hosted games use encrypted WebRTC DataChannels. The
                    signaling server introduces participants; STUN/TURN may be
                    needed across networks. The host is trusted with secrets.
                    Dedicated authority keeps rules on your self-hosted server
                    and uses WebSockets. Neither mode is public matchmaking.
                  </Disclosure>
                  <Button
                    label={busy ? "Creating party…" : "Create private party"}
                    disabled={busy}
                    icon="plus"
                    onPress={() => {
                      void enter("create");
                    }}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Invite code or link"
                    placeholder="Paste your friend’s private invitation"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Button
                    label="Scan invitation QR"
                    icon="camera"
                    kind="secondary"
                    onPress={() => setSheet("scanner")}
                  />
                  <Button
                    label={busy ? "Joining…" : "Join private party"}
                    disabled={busy}
                    icon="log-in"
                    onPress={() => {
                      void enter("join");
                    }}
                  />
                </>
              )}
              {game.error && (
                <Txt size={13} color="#F49BAD">
                  {game.error}
                </Txt>
              )}
            </>
          )}
          {sheet === "scanner" && (
            <Scanner
              onCode={(raw) => {
                setCode(raw);
                setSheet("join");
              }}
              onClose={() => setSheet("join")}
            />
          )}
          {sheet === "how" && (
            <>
              <Badge text="YOUR FRIENDS. YOUR FIELD. YOUR RULES." />
              {[
                {
                  icon: "users",
                  title: "1. Bring your people",
                  body: "Host a private party and share its code or QR invitation with friends.",
                },
                {
                  icon: "map",
                  title: "2. Pick a safe playing field",
                  body: "Choose an outdoor venue you know, set boundaries and review the rules together.",
                },
                {
                  icon: "compass",
                  title: "3. Let the adventure unfold",
                  body: "Hide a treasure, follow secret clues, capture a checkpoint or deliver virtual cargo.",
                },
                {
                  icon: "shield",
                  title: "4. Keep it fun. Keep it safe.",
                  body: "Play on foot, without physical contact. Anyone can pause. Stop sharing whenever you want.",
                },
              ].map((s) => (
                <Row key={s.title} style={{ alignItems: "flex-start" }}>
                  <Icon name={s.icon as IconName} color={t.lime} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="600">{s.title}</Txt>
                    <Txt size={14} color={t.muted}>
                      {s.body}
                    </Txt>
                  </View>
                </Row>
              ))}
              <Txt size={12} color={t.muted}>
                You need two or more real clients and a working network link. No
                imaginary players, automated captures or public location search.
              </Txt>
              <Button
                label="Let’s play"
                icon="arrow-right"
                onPress={() => host()}
              />
            </>
          )}
          {sheet === "whatsnew" && (
            <>
              <Badge text={`${build.version} · DEVELOPMENT`} />
              {changelog[0].highlights.map((h) => (
                <View key={h.title}>
                  <Txt size={18} weight="600">
                    ◇ {h.title}
                  </Txt>
                  <Txt size={14} color={t.muted}>
                    {h.body}
                  </Txt>
                </View>
              ))}
              <Txt weight="600">Fixes & Improvements</Txt>
              {changelog[0].fixes.map((f) => (
                <Txt key={f} size={13}>
                  {f}
                </Txt>
              ))}
              <Button
                label="Full changelog in Profile"
                onPress={() => {
                  setTab("Profile");
                  setSheet(undefined);
                }}
              />
            </>
          )}
        </Sheet>
      </SafeAreaView>
    </ThemeProvider>
  );
}
