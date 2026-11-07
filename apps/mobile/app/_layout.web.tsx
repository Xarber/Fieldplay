// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
const KEY = "fieldplay.web.opened.v1";
export default function WebLayout() {
  const [landing, setLanding] = useState(false);
  useEffect(() => {
    const sync = () => {
      let opened = false;
      try {
        opened = localStorage.getItem(KEY) === "yes";
      } catch {
        /* Session history remains usable. */
      }
      const root = location.pathname === "/";
      setLanding(
        root &&
          (location.hash === "#welcome" ||
            (!opened && !location.search && location.hash !== "#app")),
      );
    };
    const message = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.data !== "fieldplay:open-app"
      )
        return;
      try {
        localStorage.setItem(KEY, "yes");
      } catch {
        /* Storage may be blocked. */
      }
      history.pushState(null, "", "/#app");
      setLanding(false);
    };
    sync();
    addEventListener("popstate", sync);
    addEventListener("message", message);
    return () => {
      removeEventListener("popstate", sync);
      removeEventListener("message", message);
    };
  }, []);
  return (
    <SafeAreaProvider>
      <div style={{ display: landing ? "none" : "contents" }}>
        <Slot />
        <a
          href="/#welcome"
          aria-label="Fieldplay introduction"
          onClick={(event) => {
            event.preventDefault();
            history.pushState(null, "", "/#welcome");
            setLanding(true);
          }}
          style={{
            position: "fixed",
            right: 16,
            top: 8,
            zIndex: 50,
            background: "#10121B",
            color: "#fff",
            borderRadius: 12,
            padding: 8,
          }}
        >
          ◈ Fieldplay
        </a>
      </div>
      {landing && (
        <iframe
          title="Welcome to Fieldplay"
          src="/welcome/?embedded=1"
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            zIndex: 100,
            background: "#10121B",
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
