import { AccessibilityInfo, AppState } from "react-native";
import { useSession } from "../store/session";
import { useSettings } from "../store/settings";
import { stopMetronome, usePlayback } from "./engine";

/** The fade never goes slower than this (or the starting tempo if that's lower). */
const FADE_FLOOR_BPM = 40;

let timer: ReturnType<typeof setInterval> | null = null;
let startedAt = 0;
let startBpm = 0;
let targetBpm = 0;
let fading = false;
/** The last tempo the fade wrote. If the tempo differs, the user changed it. */
let lastSet: number | null = null;
/** Tempo to put back when the timer ends or is cancelled. */
let restoreTo: number | null = null;

function tick() {
  const { sleepEndsAt } = useSession.getState();
  if (sleepEndsAt === null) return;

  const now = Date.now();
  const remaining = sleepEndsAt - now;
  if (remaining <= 0) {
    // The state subscription in initSleep() cleans up once playback stops.
    stopMetronome();
    return;
  }
  useSession.setState({ sleepRemaining: Math.ceil(remaining / 1000) });

  if (!fading) return;
  const settings = useSettings.getState();

  // The user moved the tempo themselves: stop fading and keep their value.
  if (lastSet !== null && settings.bpm !== lastSet) {
    fading = false;
    lastSet = null;
    restoreTo = null;
    return;
  }

  const frac = Math.min(1, Math.max(0, (now - startedAt) / (sleepEndsAt - startedAt)));
  const bpm = Math.round(startBpm + (targetBpm - startBpm) * frac);
  if (bpm !== settings.bpm) {
    settings.setBpm(bpm); // the engine follows via the settings subscription
    lastSet = bpm;
  }
}

/** Start the countdown now (called when playback is running and a timer is set). */
function begin() {
  const { sleepMinutes, sleepFade } = useSession.getState();
  if (sleepMinutes === null || timer) return;

  const bpm = useSettings.getState().bpm;
  startedAt = Date.now();
  startBpm = bpm;
  targetBpm = Math.min(bpm, Math.max(FADE_FLOOR_BPM, Math.round(bpm / 2)));
  fading = sleepFade && targetBpm < startBpm;
  restoreTo = fading ? bpm : null;
  lastSet = bpm;

  useSession.setState({
    sleepEndsAt: startedAt + sleepMinutes * 60_000,
    sleepRemaining: sleepMinutes * 60,
  });
  timer = setInterval(tick, 1000);
}

/** Stop counting and put the user's tempo back if the fade changed it. */
function end() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (
    restoreTo !== null &&
    lastSet !== null &&
    useSettings.getState().bpm === lastSet
  ) {
    useSettings.getState().setBpm(restoreTo);
  }
  restoreTo = null;
  lastSet = null;
  fading = false;
  useSession.setState({ sleepEndsAt: null, sleepRemaining: null });
}

/**
 * Set (or clear with null) the sleep timer. If the metronome is already
 * running the countdown starts now; otherwise it starts with the next Start.
 */
export function setSleepMinutes(minutes: number | null) {
  end();
  useSession.setState({ sleepMinutes: minutes });
  if (minutes === null) {
    AccessibilityInfo.announceForAccessibility("Sleep timer off");
    return;
  }
  if (usePlayback.getState().state === "running") begin();
  AccessibilityInfo.announceForAccessibility(
    `Sleep timer set for ${minutes} minutes`,
  );
}

/** Changing this restarts a running countdown. */
export function setSleepFade(fade: boolean) {
  useSession.setState({ sleepFade: fade });
  const { sleepMinutes, sleepEndsAt } = useSession.getState();
  if (sleepMinutes !== null && sleepEndsAt !== null) {
    end();
    begin();
  }
}

/** Wire the timer to playback. Call once at app start; returns a cleanup. */
export function initSleep(): () => void {
  const unsubscribe = usePlayback.subscribe((s, prev) => {
    if (s.state === prev.state) return;
    if (s.state === "running") {
      begin();
    } else if (s.state === "stopped") {
      // One-shot: stopping (by hand or when the timer ends) switches it off.
      end();
      useSession.setState({ sleepMinutes: null });
    }
  });

  // Catch up straight away when the app returns to the foreground.
  const appSub = AppState.addEventListener("change", (next) => {
    if (next === "active") tick();
  });

  return () => {
    unsubscribe();
    appSub.remove();
    end();
  };
}