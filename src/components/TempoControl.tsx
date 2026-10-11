import { useRef } from "react";
import {
  type AccessibilityActionEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BPM_MAX, BPM_MIN } from "expo-precision-metronome";
import { createTapTempo, tempoMarking } from "../lib/tempo";
import { colors } from "../lib/theme";
import { useSettings } from "../store/settings";
import { Button } from "./Button";

/**
 * Tempo display with ±1 / ±5 steps and tap tempo. The number is exposed as an
 * `adjustable` element, so screen-reader users can swipe up/down to change it.
 */
export function TempoControl() {
  const bpm = useSettings((s) => s.bpm);
  const nudgeBpm = useSettings((s) => s.nudgeBpm);
  const setBpm = useSettings((s) => s.setBpm);
  const tap = useRef(createTapTempo()).current;

  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "increment") nudgeBpm(1);
    if (e.nativeEvent.actionName === "decrement") nudgeBpm(-1);
  };

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tempo"
        accessibilityValue={{
          min: BPM_MIN,
          max: BPM_MAX,
          now: bpm,
          text: `${bpm} beats per minute, ${tempoMarking(bpm)}`,
        }}
        accessibilityActions={[
          { name: "increment", label: "Faster by 1" },
          { name: "decrement", label: "Slower by 1" },
        ]}
        onAccessibilityAction={onAction}
        style={styles.display}
      >
        <Text
          style={styles.bpm}
          maxFontSizeMultiplier={1.3}
          accessibilityLiveRegion="polite"
        >
          {bpm}
        </Text>
        <Text style={styles.unit}>BPM · {tempoMarking(bpm)}</Text>
      </View>

      <View style={styles.steps}>
        <Button
          label="−5"
          accessibilityLabel="Slower by 5"
          onPress={() => nudgeBpm(-5)}
        />
        <Button
          label="−1"
          accessibilityLabel="Slower by 1"
          onPress={() => nudgeBpm(-1)}
        />
        <Button
          label="+1"
          accessibilityLabel="Faster by 1"
          onPress={() => nudgeBpm(1)}
        />
        <Button
          label="+5"
          accessibilityLabel="Faster by 5"
          onPress={() => nudgeBpm(5)}
        />
      </View>

      <Button
        label="Tap tempo"
        accessibilityHint="Tap repeatedly at the beat you want to set the tempo"
        onPress={() => {
          const next = tap.tap();
          if (next) setBpm(next);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 16 },
  display: { alignItems: "center" },
  bpm: {
    color: colors.text,
    fontSize: 88,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    lineHeight: 96,
  },
  unit: { color: colors.textMuted, fontSize: 16, letterSpacing: 1 },
  steps: { flexDirection: "row", gap: 10 },
});
