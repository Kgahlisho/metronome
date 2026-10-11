import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { MIN_TARGET, colors, radius } from "../lib/theme";

type Props = {
  label: string;
  onPress: () => void;
  /** Spoken label; defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** `stop` is a solid red button for stopping playback. */
  variant?: "primary" | "secondary" | "danger" | "stop";
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = "secondary",
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        variant === "stop" && styles.stop,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[styles.label, variant === "primary" && styles.primaryLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TARGET,
    minWidth: MIN_TARGET,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  danger: { borderColor: colors.danger },
  stop: { backgroundColor: "#C62D32", borderColor: "#C62D32" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  label: { color: colors.text, fontSize: 16, fontWeight: "600" },
  primaryLabel: { color: colors.accentText },
});