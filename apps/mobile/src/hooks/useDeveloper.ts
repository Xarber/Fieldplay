// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
export function useDeveloper(tab: string) {
  const [unlocked, setUnlocked] = useState(false);
  const taps = useRef({ count: 0, at: 0 });
  const away = useRef<number | undefined>(undefined);
  useEffect(() => {
    setUnlocked(false);
    taps.current = { count: 0, at: 0 };
  }, [tab]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        if (away.current && Date.now() - away.current >= 30000)
          setUnlocked(false);
        away.current = undefined;
      } else away.current = Date.now();
    });
    return () => sub.remove();
  }, []);
  return {
    unlocked,
    tap: () => {
      const now = Date.now();
      taps.current = {
        count: now - taps.current.at < 2000 ? taps.current.count + 1 : 1,
        at: now,
      };
      if (taps.current.count === 3) {
        setUnlocked(true);
        taps.current.count = 0;
      }
    },
    lock: () => setUnlocked(false),
  };
}
