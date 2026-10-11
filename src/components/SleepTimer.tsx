import { StyleSheet, Switch, Text, View } from "react-native";
import { setSleepFade, setSleepMinutes } from "../audio/sleep";
import { colors, radius, spacing } from "../lib/theme";
import { formatRemaining, useSession } from "../store/session";
import { Segmented } from "./Segmented";

const OPTIONS = [
  { value: "off", label: "Off" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
];

/**
 * Sleep timer: stops the metronome after the chosen time. With "Slow down
 * gradually" the tempo eases down to about half first, then stops, and your
 * tempo is put back afterwards. The countdown starts when the beat starts.
 */
export function SleepTimer() {
  const minutes = useSession((s) => s.sleepMinutes);
  const fade = useSession((s) => s.sleepFade);
  const remaining = useSession((s) => s.sleepRemaining);

  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Sleep timer
      </Text>

      <Segmented
        label="Sleep timer"
        options={OPTIONS}
        value={minutes === null ? "off" : String(minutes)}
        onChange={(v) => setSleepMinutes(v === "off" ? null : Number(v))}
      />

      {minutes !== null ? (
        <>
          <View style={styles.toggle}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Slow down gradually</Text>
              <Text style={styles.hint}>
                The tempo eases down to about half before it stops.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Slow down gradually"
              value={fade}
              onValueChange={setSleepFade}
              trackColor={{ true: colors.accent, false: colors.muted }}
            />
          </View>

          <Text style={styles.hint}>
            {remaining !== null
              ? `Stops in ${formatRemaining(remaining)}`
              : `Starts counting down when you press Start. It switches off after one use.`}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  hint: { color: colors.textMuted, fontSize: 14 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { color: colors.text, fontSize: 16, fontWeight: "600" },
});