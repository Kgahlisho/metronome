import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { initEngine, usePlayback } from "../audio/engine";
import { initSleep } from "../audio/sleep";
import { BeatOverlay } from "../components/BeatOverlay";
import { PocketMode } from "../components/pocketMode";
import { colors } from "../lib/theme";
import { useSession } from "../store/session";
import { useSettings } from "../store/settings";

const KEEP_AWAKE_TAG = "metronome-playing";

export default function RootLayout() {
  const playing = usePlayback((s) => s.state === "running");
  const keepAwake = useSettings((s) => s.keepAwake);
  const pocket = useSession((s) => s.pocket);

  useEffect(() => initEngine(), []);
  useEffect(() => initSleep(), []);

  // Pocket mode always keeps the (black) screen on, so the app stays in the
  // foreground and the vibration stays reliable.
  useEffect(() => {
    if (playing && (keepAwake || pocket)) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      };
    }
  }, [playing, keepAwake, pocket]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
          tabBarIcon: () => null,
          tabBarIconStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Play" }} />
        <Tabs.Screen name="presets" options={{ title: "Presets" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>

      {/* Full-screen beat circle; covers the tab bar while playing. */}
      <BeatOverlay />

      {/* Black vibrate-only screen; sits above everything else. */}
      <PocketMode />
    </View>
  );
}
