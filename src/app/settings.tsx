import { SOUND_PRESETS, type SoundPreset } from "expo-precision-metronome";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { askNotificationPermission } from "../audio/engine";
import { Segmented } from "../components/Segmented";
import { colors, radius, spacing } from "../lib/theme";
import { type HapticsMode, useSettings } from "../store/settings";

const HAPTICS: { value: HapticsMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "downbeat", label: "Downbeat only" },
  { value: "every", label: "Every beat" },
];

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.hint}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: colors.muted }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const s = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Settings
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            Sound
          </Text>
          <Segmented
            label="Click sound"
            options={SOUND_PRESETS.map((p) => ({
              value: p,
              label: p[0].toUpperCase() + p.slice(1),
            }))}
            value={s.sound}
            onChange={(v: SoundPreset) => s.setSound(v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            Haptics
          </Text>
          <Text style={styles.hint}>
            Vibrate on the beat — useful when you can't hear the click.
          </Text>
          <Segmented
            label="Haptic feedback"
            options={HAPTICS}
            value={s.hapticsMode}
            onChange={s.setHapticsMode}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            Playback
          </Text>
          <ToggleRow
            label="Keep screen awake"
            description="Prevents the screen from sleeping while the metronome runs."
            value={s.keepAwake}
            onChange={s.setKeepAwake}
          />
          <ToggleRow
            label="Play in background"
            description="Keeps the click going when you leave the app. Shows a notification with controls on Android."
            value={s.background}
            onChange={(v) => {
              s.setBackground(v);
              if (v) askNotificationPermission();
            }}
          />
          <ToggleRow
            label="Mix with other audio"
            description="Lowers other apps' volume instead of stopping them — handy with a backing track."
            value={s.mixWithOthers}
            onChange={s.setMixWithOthers}
          />
          <Text style={styles.hint}>
            Changes to background and mixing apply the next time you press
            Start.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.xl },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
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
