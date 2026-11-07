// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  View,
  type ViewProps,
} from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { useTheme, dark } from "./ui";
export default function GlassSurface(props: ViewProps) {
  const [reduce, setReduce] = useState(true);
  const theme = useTheme();
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const s = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduce,
    );
    return () => s.remove();
  }, []);
  if (
    Platform.OS === "ios" &&
    !reduce &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable()
  )
    return (
      <GlassView
        {...props}
        glassEffectStyle="regular"
        colorScheme={theme.bg === dark.bg ? "dark" : "light"}
        isInteractive={false}
        tintColor={theme.bg === dark.bg ? "#10121B88" : "#FFFFFFB8"}
        style={[props.style, { backgroundColor: "transparent" }]}
      />
    );
  return <View {...props} />;
}
