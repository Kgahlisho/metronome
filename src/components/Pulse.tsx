import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { usePlayback } from "../audio/engine";
import { colors } from "../lib/theme";
import { expandOverlay, registerPulse } from "../store/overlay";

/**
 * Beat circle on the home screen. While playing it pulses on each beat, and
 * tapping it opens the full-screen beat view, which grows from this circle.
 * Skips the animation when the user prefers reduced motion.
 */
export function Pulse() {
  const beat = usePlayback((s) => s.beat);
  const accent = usePlayback((s) => s.accent);
  const running = usePlayback((s) => s.state === "running");
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);
  const holder = useRef<View>(null);

  // Let the overlay find this circle's position on screen.
  useEffect(() => {
    registerPulse(holder);
    return () => registerPulse(null);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (v) => {
        reduceMotion.current = v;
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (beat < 0 || reduceMotion.current) return;
    scale.setValue(accent === "strong" ? 1.18 : 1.08);
    Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [beat, accent, scale]);

  const tone =
    accent === "strong"
      ? colors.strong
      : accent === "normal"
        ? colors.normal
        : colors.muted;

  return (
    // collapsable={false} keeps this view in the native tree so it can be measured.
    <View ref={holder} collapsable={false} style={styles.holder}>
      <Pressable
        disabled={!running}
        onPress={expandOverlay}
        accessible={running}
        importantForAccessibility={running ? "yes" : "no-hide-descendants"}
        accessibilityRole="button"
        accessibilityLabel="Beat indicator"
        accessibilityHint="Opens the full-screen beat view"
      >
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: beat < 0 ? colors.surfaceRaised : tone },
            { transform: [{ scale }] },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  holder: { width: 96, height: 96 },
  dot: { width: 96, height: 96, borderRadius: 48 },
});