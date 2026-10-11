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
import { create } from "zustand";
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
  } catch (e) {
    fail(e);
  }
}

export async function stopMetronome() {
  try {
    await stop();
  } catch (e) {
    fail(e);
  }
}

export async function togglePlayback() {
  const { state } = usePlayback.getState();
  if (state === "stopped") await startMetronome();
  else if (state === "paused") await resume().catch(fail);
  else await stopMetronome();
}

export async function pauseMetronome() {
  await pause().catch(fail);
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
  const mode = useSettings.getState().hapticsMode;
  if (mode === "off" || accent === "muted") return;
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
    },
  );

  // Events only cover transitions we were mounted for; reconcile on startup.
  getState()
    .then(({ state }) => usePlayback.setState({ state }))
    .catch(() => {});

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
    unsubscribe();
  };
}
