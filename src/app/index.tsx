import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { togglePlayback, usePlayback } from "../audio/engine";
import { BeatRow } from "../components/BeatRow";
import { Button } from "../components/Button";
import { Pulse } from "../components/Pulse";
import { Segmented } from "../components/Segmented";
import { TempoControl } from "../components/TempoControl";
import { colors, spacing } from "../lib/theme";
import { TIME_SIGNATURES, useSettings } from "../store/settings";

export default function PlayScreen() {
  const state = usePlayback((s) => s.state);
  const error = usePlayback((s) => s.error);
  const pattern = useSettings((s) => s.pattern);
  const setPattern = useSettings((s) => s.setPattern);
  const addBeat = useSettings((s) => s.addBeat);
  const removeBeat = useSettings((s) => s.removeBeat);

  // Highlight a time signature chip only while the pattern matches it exactly.
  const currentSig =
    TIME_SIGNATURES.find(
      (t) =>
        t.pattern.length === pattern.length &&
        t.pattern.every((a, i) => a === pattern[i]),
    )?.label ?? null;

  const label =
    state === "running" ? "Stop" : state === "paused" ? "Resume" : "Start";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pulse}>
          <Pulse />
        </View>

        <TempoControl />

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            Time signature
          </Text>
          <Segmented
            label="Time signature"
            options={TIME_SIGNATURES.map((t) => ({
              value: t.label,
              label: t.label,
            }))}
            value={currentSig}
            onChange={(v) =>
              setPattern(
                [...(TIME_SIGNATURES.find((t) => t.label === v)?.pattern ?? [])],
              )
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            Accents
          </Text>
          <BeatRow />
          <View style={styles.beatButtons}>
            <Button
              label="− Beat"
              accessibilityLabel="Remove a beat"
              onPress={removeBeat}
              disabled={pattern.length <= 1}
            />
            <Button
              label="+ Beat"
              accessibilityLabel="Add a beat"
              onPress={addBeat}
              disabled={pattern.length >= 16}
            />
          </View>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={label}
          variant={state === "running" ? "danger" : "primary"}
          accessibilityHint={
            state === "running" ? "Stops the metronome" : "Starts the metronome"
          }
          onPress={togglePlayback}
          style={styles.playButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.xl, alignItems: "stretch" },
  pulse: { alignItems: "center", paddingTop: spacing.md },
  section: { gap: spacing.md },
  heading: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  beatButtons: { flexDirection: "row", gap: 10, justifyContent: "center" },
  error: { color: colors.danger, fontSize: 14 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  playButton: { minHeight: 64 },
});
