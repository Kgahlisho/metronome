import { useEffect, useState } from "react";
import {
  type AccessibilityActionEvent,
  AccessibilityInfo,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { stopMetronome, usePlayback } from "../audio/engine";
import { exitPocket, formatRemaining, useSession } from "../store/session";
import { useSettings } from "../store/settings";

/** How long to hold the screen to leave pocket mode. */
const HOLD_MS = 1000;

/**
 * Pocket mode: the screen goes black and the beat is felt as vibration (the
 * vibration itself is in engine.ts). Ordinary taps do nothing, so a phone in
 * a pocket or bag can't be stopped by accident. Hold the screen for a second
 * to leave; the Android Back button is ignored here for the same reason.
 *
 * Screen readers get one labelled button: activating it leaves pocket mode,
 * and "Stop metronome" is in the actions menu.
 */
export function PocketMode() {
  const pocket = useSession((s) => s.pocket);
  const remaining = useSession((s) => s.sleepRemaining);
  const running = usePlayback((s) => s.state === "running");
  const bpm = useSettings((s) => s.bpm);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReader,
    );
    return () => sub.remove();
  }, []);

  // Playback ended or paused (call, notification, sleep timer): leave pocket mode.
  useEffect(() => {
    if (pocket && !running) exitPocket();
  }, [pocket, running]);

  // Swallow Back so a stray gesture in a pocket doesn't do anything.
  useEffect(() => {
    if (!pocket) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [pocket]);

  if (!pocket) return null;

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "exit") exitPocket();
    if (e.nativeEvent.actionName === "stop") stopMetronome();
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.top]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Pressable
        onLongPress={exitPocket}
        delayLongPress={HOLD_MS}
        // A screen reader's double tap is a plain press, so let it exit.
        onPress={screenReader ? exitPocket : undefined}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Pocket mode. Vibrating the beat at ${bpm} beats per minute.`}
        accessibilityHint="Activate to leave pocket mode. Open the actions menu to stop the metronome."
        accessibilityActions={[
          { name: "exit", label: "Leave pocket mode" },
          { name: "stop", label: "Stop metronome" },
        ]}
        onAccessibilityAction={onAccessibilityAction}
        style={styles.fill}
      >
        {/* Deliberately very dim so the screen stays dark in a bedroom or on stage. */}
        <View pointerEvents="none" style={styles.center}>
          {remaining !== null ? (
            <Text style={styles.dim}>Stops in {formatRemaining(remaining)}</Text>
          ) : null}
          <Text style={styles.dim}>Hold anywhere to leave</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { zIndex: 2000, elevation: 2000 },
  fill: { flex: 1, backgroundColor: "#000000" },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 64,
    gap: 6,
  },
  dim: { color: "#3A3A3A", fontSize: 14 },
});