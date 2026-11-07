// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Button, Row, Txt, useTheme } from "./ui";
import { EASE_OUT } from "./motion";
export default function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const previous = useRef({ title, children });
  useEffect(() => {
    if (visible) previous.current = { title, children };
  }, [visible, title, children]);
  const shownTitle = visible ? title : previous.current.title,
    shownChildren = visible ? children : previous.current.children;
  const reduced = useReducedMotion();
  const [present, setPresent] = useState(visible);
  const opacity = useSharedValue(0),
    scale = useSharedValue(0.97);
  useEffect(() => {
    if (visible) {
      setPresent(true);
      opacity.set(
        withTiming(1, { duration: reduced ? 100 : 200, easing: EASE_OUT }),
      );
      scale.set(
        reduced ? 1 : withSpring(1, { duration: 300, dampingRatio: 1 }),
      );
    } else {
      opacity.set(
        withTiming(
          0,
          { duration: reduced ? 80 : 140, easing: EASE_OUT },
          (finished) => {
            if (finished) scheduleOnRN(setPresent, false);
          },
        ),
      );
      scale.set(
        reduced ? 1 : withTiming(0.97, { duration: 140, easing: EASE_OUT }),
      );
    }
  }, [visible, reduced]);
  const scrim = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const panel = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Modal
      visible={present}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "#050711BA",
            },
            scrim,
          ]}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              width: "100%",
              maxWidth: 620,
              maxHeight: "94%",
              backgroundColor: t.panel,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: t.line,
              overflow: "hidden",
            },
            panel,
          ]}
        >
          <Row
            style={{
              justifyContent: "space-between",
              padding: 22,
              borderBottomWidth: 1,
              borderBottomColor: t.line,
            }}
          >
            <Txt size={23} weight="700">
              {shownTitle}
            </Txt>
            <Button
              label="Close"
              icon="x"
              kind="ghost"
              small
              onPress={onClose}
            />
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, gap: 20 }}
          >
            {shownChildren}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
