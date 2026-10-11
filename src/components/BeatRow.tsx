import { Pressable, StyleSheet, Text, View } from "react-native";
import { MIN_TARGET, colors, radius } from "../lib/theme";
import { usePlayback } from "../audio/engine";
import { useSettings } from "../store/settings";

const HEIGHT: Record<string, number> = { strong: 56, normal: 40, muted: 24 };
const COLOR: Record<string, string> = {
  strong: colors.strong,
  normal: colors.normal,
  muted: colors.muted,
};

/**
 * One cell per beat. The height and colour show the accent level; the active
 * beat is highlighted while playing. Tap a cell to cycle strong → normal → muted.
 */
export function BeatRow() {
  const pattern = useSettings((s) => s.pattern);
  const cycleBeat = useSettings((s) => s.cycleBeat);
  const beat = usePlayback((s) => s.beat);
  const active = beat >= 0 ? beat % pattern.length : -1;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`Accent pattern, ${pattern.length} beats`}
    >
      {pattern.map((accent, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={`Beat ${i + 1}, ${accent}`}
          accessibilityHint="Double tap to change the accent"
          onPress={() => cycleBeat(i)}
          style={styles.cell}
        >
          <View
            style={[
              styles.bar,
              {
                height: HEIGHT[accent],
                backgroundColor: COLOR[accent],
                opacity: active === i ? 1 : 0.45,
                borderColor: active === i ? colors.text : "transparent",
              },
            ]}
          />
          <Text style={[styles.num, active === i && styles.numActive]}>
            {i + 1}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  cell: {
    minWidth: MIN_TARGET - 8,
    minHeight: MIN_TARGET + 24,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  bar: {
    width: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  num: { color: colors.textMuted, fontSize: 12 },
  numActive: { color: colors.text, fontWeight: "700" },
});
