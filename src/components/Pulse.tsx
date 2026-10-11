import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet } from "react-native";
import { usePlayback } from "../audio/engine";
import { colors } from "../lib/theme";

/** Visual beat pulse. Skips the animation when the user prefers reduced motion. */
export function Pulse() {
  const beat = usePlayback((s) => s.beat);
  const accent = usePlayback((s) => s.accent);
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

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
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.dot,
        { backgroundColor: beat < 0 ? colors.surfaceRaised : tone },
        { transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { width: 96, height: 96, borderRadius: 48 },
});
