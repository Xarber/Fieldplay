// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
  type TextInputProps,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { DISCLOSURE_IN, DISCLOSURE_OUT, CSS_EASE_OUT } from "./motion";
import Feather from "@expo/vector-icons/Feather";
export const dark = {
  bg: "#10121B",
  panel: "#191C28",
  raised: "#222635",
  text: "#F4F3F8",
  muted: "#A3A6BA",
  line: "#2C3040",
  accent: "#6269F5",
  button: "#555CE0",
  lime: "#C4EF9A",
  input: "#121520",
};
export const light = {
  bg: "#F6F6FA",
  panel: "#FFFFFF",
  raised: "#ECEEF5",
  text: "#171B30",
  muted: "#62677D",
  line: "#DDE0EC",
  accent: "#555CE0",
  button: "#555CE0",
  lime: "#406323",
  input: "#F1F3F9",
};
const Theme = createContext(dark);
export const ThemeProvider = Theme.Provider;
export const useTheme = () => useContext(Theme);
export type IconName = React.ComponentProps<typeof Feather>["name"];
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const t = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? t.text}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
export function Txt({
  children,
  size = 15,
  weight = "400",
  color,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: TextStyle["fontWeight"];
  color?: string;
  style?: TextStyle;
}) {
  const t = useTheme();
  return (
    <Text
      selectable
      style={[
        {
          fontSize: size,
          fontWeight: weight,
          color: color ?? t.text,
          lineHeight: size * 1.45,
          flexShrink: 1,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  icon,
  kind = "primary",
  disabled = false,
  small = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  kind?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  small?: boolean;
}) {
  const t = useTheme(),
    reduced = useReducedMotion();
  const bg =
    kind === "primary"
      ? t.button
      : kind === "danger"
        ? "#A63D57"
        : kind === "secondary"
          ? t.raised
          : "transparent";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      pressRetentionOffset={16}
    >
      {({ pressed }) => (
        <Animated.View
          style={{
            backgroundColor: pressed && kind === "primary" ? "#454DC3" : bg,
            borderRadius: 13,
            paddingHorizontal: small ? 14 : 20,
            minHeight: small ? 48 : 50,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 9,
            opacity: disabled ? 0.45 : 1,
            borderWidth: kind === "secondary" ? 1 : 0,
            borderColor: t.line,
            transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
            transitionProperty: ["transform", "opacity"],
            transitionDuration: reduced ? 0 : 120,
            transitionTimingFunction: CSS_EASE_OUT,
          }}
        >
          {icon && (
            <Icon
              name={icon}
              size={small ? 16 : 18}
              color={kind === "primary" || kind === "danger" ? "#FFF" : t.text}
            />
          )}
          <Txt
            size={small ? 13 : 14}
            weight="600"
            color={kind === "primary" || kind === "danger" ? "#FFF" : t.text}
          >
            {label}
          </Txt>
        </Animated.View>
      )}
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.panel,
          borderColor: t.line,
          borderWidth: 1,
          borderRadius: 20,
          padding: 22,
          gap: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Txt size={13} weight="600" color={t.muted}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        {...props}
        style={[
          {
            backgroundColor: t.input,
            borderColor: t.line,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            minHeight: 48,
            color: t.text,
            fontSize: 16,
          },
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Badge({
  text,
  color,
  background,
}: {
  text: string;
  color?: string;
  background?: string;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: background ?? t.raised,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: "flex-start",
      }}
    >
      <Txt size={11} weight="700" color={color ?? t.lime}>
        {text}
      </Txt>
    </View>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Section({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Txt size={23} weight="700">
          {title}
        </Txt>
        {detail && <Txt color={useTheme().muted}>{detail}</Txt>}
      </View>
      {children}
    </View>
  );
}
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: 9,
        }}
      >
        <Icon name={open ? "chevron-down" : "info"} size={17} color={t.muted} />
        <Txt size={13} color={t.muted}>
          {title}
        </Txt>
      </Pressable>
      {open && (
        <Animated.View
          entering={DISCLOSURE_IN}
          exiting={DISCLOSURE_OUT}
          style={{
            padding: 14,
            backgroundColor: t.raised,
            borderRadius: 12,
            gap: 9,
          }}
        >
          {typeof children === "string" ? (
            <Txt size={13}>{children}</Txt>
          ) : (
            children
          )}
        </Animated.View>
      )}
    </View>
  );
}
export const styles = StyleSheet.create({
  stack: { gap: 20 },
  grow: { flex: 1 },
  split: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  half: { flexGrow: 1, flexBasis: 320 },
  divider: { height: 1, backgroundColor: "#2C3040" },
});
