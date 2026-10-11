import * as Haptics from "expo-haptics";
import ExpoPrecisionMetronomeModule, {
  getState,
  pause,
  requestNotificationPermission,
  resume,
  setBpm,
  setPattern,
  setSound,
  start,
  stop,
  type BeatAccent,
  type PlaybackState,
} from "expo-precision-metronome";
import { AppState, Platform, Vibration } from "react-native";
import { create } from "zustand";
import { collapseOverlay, expandOverlay } from "../store/overlay";
import { useSession } from "../store/session";
import { useSettings } from "../store/settings";

type PlaybackStore = {
  state: PlaybackState;
  /** Beat index counted from the last start/resume; -1 until the first beat. */
  beat: number;
  accent: BeatAccent | null;
  error: string | null;
};

export const usePlayback = create<PlaybackStore>(() => ({
  state: "stopped",
  beat: -1,
  accent: null,
  error: null,
}));

function fail(e: unknown) {
  usePlayback.setState({
    error: e instanceof Error ? e.message : String(e),
  });
}

/**
 * Copy the engine's real state into the store. Events only cover transitions
 * we were listening for, so call this after commands and when the app returns
 * to the foreground.
 */

usePlayback.setState({ state: "running" });
async function syncFromNative() {
  try {
    const { state } = await getState();
    if (state === usePlayback.getState().state) return;
    usePlayback.setState(
      state === "running" ? { state } : { state, beat: -1, accent: null },
    );
    if (state !== "running") collapseOverlay();
  } catch {
    // Leave the store as it is; the next event or foreground sync will fix it.
  }
}

/** Start from the current settings. */
export async function startMetronome() {
  const s = useSettings.getState();
  usePlayback.setState({ error: null, beat: -1, accent: null });
  try {
    await setSound(s.sound);
    await setPattern(s.pattern);
    await start(s.bpm, {
      background: s.background
        ? { title: "Metronome", color: "#F5A524" }
        : false,
      mixWithOthers: s.mixWithOthers,
    });
    // Don't wait for the native event to show Stop / Beat view.
    await syncFromNative();
  } catch (e) {
    fail(e);
  }
}

export async function stopMetronome() {
  try {
    await stop();
    // stop() resolved, so playback is stopped: update the buttons right away
    // instead of relying on the native event arriving.
    usePlayback.setState({ state: "stopped", beat: -1, accent: null });
  } catch (e) {
    fail(e);
    await syncFromNative();
  }
  collapseOverlay();
}

/**
 * Start / resume / stop from the home screen. Starting or resuming also opens
 * the full-screen beat view, growing from the circle.
 */
export async function togglePlayback() {
  const { state } = usePlayback.getState();
  if (state === "stopped") {
    await startMetronome();
    if (!usePlayback.getState().error) expandOverlay();
  } else if (state === "paused") {
    usePlayback.setState({ error: null });
    await resume().catch(fail);
    await syncFromNative();
    if (!usePlayback.getState().error) expandOverlay();
  } else {
    await stopMetronome();
  }
}

export async function pauseMetronome() {
  await pause().catch(fail);
  await syncFromNative();
}

/**
 * Android 13+ gates the foreground-service notification behind a runtime
 * permission. Playback works without it, so failures are swallowed.
 */
export async function askNotificationPermission() {
  try {
    return await requestNotificationPermission();
  } catch {
    return false;
  }
}

function buzz(accent: BeatAccent) {
  if (accent === "muted") return;

  // Pocket mode: feel every beat, strong ones longer, whatever the haptics
  // setting says. Android's plain vibration is much easier to feel through
  // clothing than the light haptic taps, so use it there.
  if (useSession.getState().pocket) {
    if (Platform.OS === "android") {
      Vibration.vibrate(accent === "strong" ? 90 : 40);
    } else {
      Haptics.impactAsync(
        accent === "strong"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium,
      ).catch(() => {});
    }
    return;
  }

  const mode = useSettings.getState().hapticsMode;
  if (mode === "off") return;
  if (mode === "downbeat" && accent !== "strong") return;
  Haptics.impactAsync(
    accent === "strong"
      ? Haptics.ImpactFeedbackStyle.Heavy
      : Haptics.ImpactFeedbackStyle.Light,
  ).catch(() => {});
}

let initialised = false;

/**
 * Wire native events and settings → engine sync. Call once at app start;
 * returns a cleanup function.
 */
export function initEngine(): () => void {
  if (initialised) return () => {};
  initialised = true;

  const beatSub = ExpoPrecisionMetronomeModule.addListener(
    "onBeat",
    ({ beat, accent }) => {
      usePlayback.setState({ beat, accent });
      buzz(accent);
    },
  );

  const playbackSub = ExpoPrecisionMetronomeModule.addListener(
    "onPlaybackChange",
    ({ state }) => {
      usePlayback.setState(
        state === "running" ? { state } : { state, beat: -1, accent: null },
      );
      // Stopped or paused (call, headphones, notification): leave the full-screen view.
      if (state !== "running") collapseOverlay();
    },
  );

  // Events only cover transitions we were mounted for; reconcile on startup.
  syncFromNative();

  // The notification can pause/stop while the app is in the background.
  const appStateSub = AppState.addEventListener("change", (next) => {
    if (next === "active") syncFromNative();
  });

  // Push setting changes to the engine live (no restart, no gap).
  const unsubscribe = useSettings.subscribe((next, prev) => {
    if (usePlayback.getState().state === "stopped") return;
    if (next.bpm !== prev.bpm) setBpm(next.bpm).catch(fail);
    if (next.sound !== prev.sound) setSound(next.sound).catch(fail);
    if (next.pattern !== prev.pattern) setPattern(next.pattern).catch(fail);
  });

  return () => {
    initialised = false;
    beatSub.remove();
    playbackSub.remove();
    appStateSub.remove();
    unsubscribe();
  };
}