import { useEffect, useRef, useState } from "react";
import {
  type AccessibilityActionEvent,
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { stopMetronome, usePlayback } from "../audio/engine";
import { colors } from "../lib/theme";
import { collapseOverlay, useOverlay } from "../store/overlay";
import { useSettings } from "../store/settings";

/** Diameter of the home-screen circle the overlay grows from. */
const START_DIAMETER = 96;
/** Two taps within this window count as a double tap. */
const DOUBLE_TAP_MS = 280;

const TONE = {
  strong: { bg: colors.strong, fg: colors.accentText },
  normal: { bg: colors.normal, fg: "#0B1530" },
  muted: { bg: colors.muted, fg: colors.text },
  idle: { bg: colors.surfaceRaised, fg: colors.text },
};

/** How far the circle dips on each beat (1 = no dip). */
const BEAT_DIP = { strong: 0.86, normal: 0.93, muted: 0.97 };

/**
 * Full-screen beat view.
 *  - Grows smoothly from the home-screen circle until it fills the screen.
 *  - Pulses and changes colour on every beat.
 *  - Shows the two things you can do: tap (home) and double tap (stop).
 * The Stop button itself lives on the home screen.
 *
 * It only receives touches while it is open. While it shrinks back (or is
 * hidden) touches go through to the home screen, so Stop is always tappable.
 *
 * Accessibility: the whole view is one labelled button. Activating it returns
 * to the home screen; "Stop metronome" and "Back to home screen" are also in
 * the screen reader's actions menu.
 */
export function BeatOverlay() {
  const expanded = useOverlay((s) => s.expanded);
  const origin = useOverlay((s) => s.origin);
  const beat = usePlayback((s) => s.beat);
  const accent = usePlayback((s) => s.accent);
  const bpm = useSettings((s) => s.bpm);
  const patternLength = useSettings((s) => s.pattern.length);
  const { width, height } = useWindowDimensions();

  // Grow from the circle's centre; if it couldn't be measured, from mid-screen.
  const cx = origin?.x ?? width / 2;
  const cy = origin?.y ?? height / 2;
  // Radius that reaches the farthest screen corner from that centre.
  const radius =
    Math.ceil(
      Math.max(
        Math.hypot(cx, cy),
        Math.hypot(width - cx, cy),
        Math.hypot(cx, height - cy),
        Math.hypot(width - cx, height - cy),
      ),
    ) + 4;
  const diameter = radius * 2;
  const startScale = START_DIAMETER / diameter;

  const grow = useRef(new Animated.Value(0)).current; // 0 = circle, 1 = full screen
  const dip = useRef(new Animated.Value(1)).current; // per-beat pulse
  const reduceMotion = useRef(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

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
    return () => {
      sub.remove();
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  // Grow when opened, shrink back into the circle when closed.
  useEffect(() => {
    if (expanded) {
      setMounted(true);
      if (reduceMotion.current) {
        grow.setValue(1);
        return;
      }
      Animated.timing(grow, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Closed from somewhere else (Stop, Back): drop any pending tap.
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      if (reduceMotion.current) {
        grow.setValue(0);
        setMounted(false);
        return;
      }
      Animated.timing(grow, {
        toValue: 0,
        duration: 350,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [expanded, grow]);

  // Pulse on every beat (skipped when the user prefers reduced motion).
  useEffect(() => {
    if (beat < 0 || !accent || reduceMotion.current) return;
    dip.setValue(BEAT_DIP[accent]);
    Animated.timing(dip, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [beat, accent, dip]);

  // Android Back returns to the home screen, like a single tap.
  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      collapseOverlay();
      return true;
    });
    return () => sub.remove();
  }, [expanded]);

  // One tap waits briefly in case a second follows; two taps stop the metronome.
  const onTap = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      stopMetronome();
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      collapseOverlay();
    }, DOUBLE_TAP_MS);
  };

  // Screen-reader actions menu (VoiceOver rotor / TalkBack actions).
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "stop") stopMetronome();
    if (e.nativeEvent.actionName === "home") collapseOverlay();
  };

  if (!mounted) return null;

  const tone = accent ? TONE[accent] : TONE.idle;
  const scale = Animated.multiply(
    grow.interpolate({ inputRange: [0, 1], outputRange: [startScale, 1] }),
    dip,
  );
  const fadeIn = grow.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const beatNumber = beat >= 0 ? (beat % patternLength) + 1 : "•";

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.top]}
      // While shrinking, let touches reach the home screen (Stop, tabs, ...).
      pointerEvents={expanded ? "auto" : "none"}
      accessibilityViewIsModal={expanded}
      importantForAccessibility={expanded ? "yes" : "no-hide-descendants"}
    >
      <Pressable
        onPress={onTap}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Beat view, playing at ${bpm} beats per minute`}
        accessibilityHint="Activate to go back to the home screen, where the Stop button is. Open the actions menu to stop the metronome from here."
        accessibilityActions={[
          { name: "home", label: "Back to home screen" },
          { name: "stop", label: "Stop metronome" },
        ]}
        onAccessibilityAction={onAccessibilityAction}
        style={StyleSheet.absoluteFill}
      >
        {/* Opaque backdrop so the app never shows through the corners. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.bg,
              opacity: grow.interpolate({
                inputRange: [0, 0.4],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: diameter,
            height: diameter,
            left: cx - radius,
            top: cy - radius,
            borderRadius: radius,
            backgroundColor: tone.bg,
            transform: [{ scale }],
          }}
        />

        <Animated.View
          pointerEvents="none"
          style={[styles.content, { opacity: fadeIn }]}
        >
          <Text
            style={[styles.beat, { color: tone.fg }]}
            maxFontSizeMultiplier={1.2}
          >
            {beatNumber}
          </Text>
          <Text style={[styles.bpm, { color: tone.fg }]}>{bpm} BPM</Text>

          {/* The two actions available here. */}
          <View style={styles.actions}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Tap · back to home</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Double tap · stop the beat</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Keep the overlay above the tab bar and anything else on screen.
  top: { zIndex: 1000, elevation: 1000 },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  beat: {
    fontSize: 160,
    fontWeight: "800",
    lineHeight: 170,
    fontVariant: ["tabular-nums"],
  },
  bpm: { fontSize: 28, fontWeight: "700", letterSpacing: 1 },
  actions: { alignItems: "center", gap: 10, marginTop: 32 },
  // Dark pills keep the text readable on every beat colour.
  pill: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pillText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});