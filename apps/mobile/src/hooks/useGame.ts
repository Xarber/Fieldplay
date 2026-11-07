// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import {
  GameClient,
  type Credentials,
  type Status,
} from "@fieldplay/transport";
import type { Command, Sample, View } from "@fieldplay/engine";
import { prepareRTC } from "../services/rtc";
import {
  clearSession,
  loadSession,
  read,
  saveSession,
  write,
} from "../services/storage";
// Expo provides cryptographically secure randomness on native, matching the shared engine.
if (Platform.OS !== "web" && !globalThis.crypto?.getRandomValues)
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: Crypto.getRandomValues,
      randomUUID: Crypto.randomUUID,
    },
  });
export type RecentParty = {
  name: string;
  code: string;
  server: string;
  at: number;
};
export function useGame() {
  const [view, setView] = useState<View>();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [sharingSuspended, setSharingSuspended] = useState(false);
  const stopWatcher = useRef<() => void>(() => {});
  const [status, setStatus] = useState<Status>({
    connection: "offline",
    transport: "none",
    peers: 0,
    message: "Choose a private server to play",
  });
  const [error, setError] = useState("");
  const [sample, setSample] = useState<Sample>();
  const [gps, setGPS] = useState("Not sharing");
  const [credentials, setCredentials] = useState<Credentials>();
  const [saved, setSaved] = useState<{
    credentials: Credentials;
    server: string;
    name: string;
  }>();
  const [recent, setRecent] = useState<RecentParty[]>([]);
  const client = useRef<GameClient | null>(null);
  const current = useRef(view);
  current.current = view;
  const profile = useRef({ server: "", name: "" });
  const lastError = useRef("");
  const report = useCallback((s: string) => {
    if (s !== lastError.current) {
      setError(s);
      lastError.current = s;
    }
  }, []);
  const init = () =>
    client.current ??
    (client.current = new GameClient({
      onView: (v) => {
        setView(v);
        if (v.phase === "finished")
          void write("history", v.results).catch(() =>
            report("Could not save match history."),
          );
      },
      onStatus: setStatus,
      onError: report,
      onCredentials: (c) => {
        setCredentials(c);
        const data = { credentials: c, ...profile.current };
        setSaved(data);
        void saveSession(data).catch(() =>
          report("Could not save this session securely."),
        );
      },
    }));
  useEffect(() => {
    void loadSession<{
      credentials: Credentials;
      server: string;
      name: string;
    }>().then(setSaved);
    void read<RecentParty[]>("recent", [])
      .then(setRecent)
      .catch((e) => report(e.message));
    return () => client.current?.close();
  }, []);
  const connect = async (options: {
    server: string;
    name: string;
    code?: string;
    operation: "create" | "join" | "resume";
    authority?: "peer" | "dedicated";
    relayOnly?: boolean;
    partyName?: string;
  }) => {
    setError("");
    lastError.current = "";
    const url = new URL(options.server);
    if (
      url.protocol !== "wss:" &&
      !(
        url.protocol === "ws:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    )
      throw new Error(
        "Use a secure wss:// server. Local ws:// is allowed only on this computer.",
      );
    setSharingSuspended(false);
    prepareRTC();
    profile.current = { server: options.server, name: options.name };
    const c = init();
    if (c.credentials) c.close();
    await c.connect(options.server, {
      ...options,
      token:
        options.operation === "resume" ? saved?.credentials.token : undefined,
      code:
        options.operation === "resume" ? saved?.credentials.code : options.code,
    });
    if (options.operation === "create" && options.authority === "peer") {
      // Browser/mobile host state will arrive locally. No game data is fabricated.
    }
    const entry = {
      name: options.partyName ?? "Private party",
      code: c.credentials!.code,
      server: options.server,
      at: Date.now(),
    };
    const entries = [
      entry,
      ...recent.filter((p) => p.code !== entry.code),
    ].slice(0, 8);
    setRecent(entries);
    await write("recent", entries);
  };
  const send = useCallback(
    (command: Command) => {
      try {
        if (command.type === "consent") {
          setSharingSuspended(!command.accepted);
          if (!command.accepted) stopWatcher.current();
        }
        client.current?.send(command);
        lastError.current = "";
      } catch (e) {
        report(e instanceof Error ? e.message : "Action rejected.");
      }
    },
    [report],
  );
  const self = view?.players.find((p) => p.id === credentials?.id);
  const shouldShare =
    foreground &&
    !sharingSuspended &&
    !!self?.consent &&
    !!view &&
    ["lobby", "return", "active"].includes(view.phase) &&
    status.connection === "connected";
  useEffect(() => {
    if (!shouldShare) {
      setSample(undefined);
      setGPS("Not sharing");
      return;
    }
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    stopWatcher.current = () => {
      cancelled = true;
      subscription?.remove();
    };
    void (async () => {
      setGPS("Requesting location permission…");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        send({ type: "consent", accepted: false });
        setGPS("Permission denied");
        throw new Error(
          "Location permission is required to play. You can still stay in the party.",
        );
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2500,
          distanceInterval: 0,
        },
        (fix) => {
          if (cancelled) return;
          const s: Sample = {
            latitude: fix.coords.latitude,
            longitude: fix.coords.longitude,
            accuracy: fix.coords.accuracy ?? 1000,
            timestamp: fix.timestamp,
            provenance: "measured",
          };
          setSample(s);
          setGPS(`GPS ±${Math.round(s.accuracy)} m`);
          send({ type: "location", sample: s });
        },
      );
      if (cancelled) subscription.remove();
    })().catch((e) =>
      report(e instanceof Error ? e.message : "Location unavailable."),
    );
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [shouldShare]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") stopWatcher.current();
      if (
        state !== "active" &&
        current.current &&
        ["active", "return"].includes(current.current.phase)
      )
        send({ type: "pause" });
    });
    return () => subscription.remove();
  }, [send]);
  const stop = () => {
    send({ type: "consent", accepted: false });
    setSample(undefined);
    setGPS("Not sharing");
  };
  const leave = async () => {
    stopWatcher.current();
    setSharingSuspended(true);
    send({ type: "leave" });
    client.current?.close();
    client.current = null;
    setView(undefined);
    setCredentials(undefined);
    setSaved(undefined);
    setSample(undefined);
    setGPS("Not sharing");
    await clearSession();
  };
  return {
    view,
    status,
    error,
    setError,
    report,
    sample,
    gps,
    credentials,
    saved,
    recent,
    connect,
    send,
    stop,
    leave,
    self,
    client,
  };
}
export type Game = ReturnType<typeof useGame>;
