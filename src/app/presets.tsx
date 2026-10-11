import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { MIN_TARGET, colors, radius, spacing } from "../lib/theme";
import { useSettings } from "../store/settings";

export default function PresetsScreen() {
  const presets = useSettings((s) => s.presets);
  const savePreset = useSettings((s) => s.savePreset);
  const loadPreset = useSettings((s) => s.loadPreset);
  const deletePreset = useSettings((s) => s.deletePreset);
  const [name, setName] = useState("");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={presets}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.save}>
            <Text style={styles.title} accessibilityRole="header">
              Presets
            </Text>
            <Text style={styles.hint}>
              Saves the current tempo, accent pattern and sound.
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Preset name"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Preset name"
              style={styles.input}
              returnKeyType="done"
            />
            <Button
              label="Save current settings"
              variant="primary"
              onPress={() => {
                savePreset(name);
                setName("");
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No presets yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.bpm} BPM · {item.pattern.length} beats · {item.sound}
              </Text>
            </View>
            <Button
              label="Load"
              accessibilityLabel={`Load preset ${item.name}`}
              onPress={() => loadPreset(item.id)}
            />
            <Button
              label="Delete"
              variant="danger"
              accessibilityLabel={`Delete preset ${item.name}`}
              onPress={() => deletePreset(item.id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  save: { gap: spacing.md, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  hint: { color: colors.textMuted, fontSize: 14 },
  input: {
    minHeight: MIN_TARGET,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});
