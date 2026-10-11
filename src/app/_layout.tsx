import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { initEngine, usePlayback } from "../audio/engine";
import { colors } from "../lib/theme";
import { useSettings } from "../store/settings";

const KEEP_AWAKE_TAG = "metronome-playing";

export default function RootLayout() {
  const playing = usePlayback((s) => s.state === "running");
  const keepAwake = useSettings((s) => s.keepAwake);

  useEffect(() => initEngine(), []);

  useEffect(() => {
    if (playing && keepAwake) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      };
    }
  }, [playing, keepAwake]);

  return (
    <>
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
    </>
  );
}
