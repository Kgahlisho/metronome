import { Pressable, StyleSheet, Text, View } from "react-native";
import { MIN_TARGET, colors, radius } from "../lib/theme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

/** Wrapping group of mutually exclusive chips (radio-group semantics). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.row}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Text style={[styles.text, selected && styles.textOn]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: MIN_TARGET,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { color: colors.text, fontSize: 15, fontWeight: "600" },
  textOn: { color: colors.accentText },
});
