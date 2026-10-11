import { create } from "zustand";

/** Short-lived, in-memory state for pocket mode and the sleep timer. */
type SessionStore = {
  /** Pocket mode: black screen, the beat is felt as vibration. */
  pocket: boolean;
  /** Minutes the sleep timer is set for; null = off. */
  sleepMinutes: number | null;
  /** Ease the tempo down to about half before the timer ends. */
  sleepFade: boolean;
  /** Epoch ms when the running countdown ends; null until playback starts. */
  sleepEndsAt: number | null;
  /** Seconds left, refreshed every second while counting down. */
  sleepRemaining: number | null;
};

export const useSession = create<SessionStore>(() => ({
  pocket: false,
  sleepMinutes: null,
  sleepFade: true,
  sleepEndsAt: null,
  sleepRemaining: null,
}));

export function enterPocket() {
  useSession.setState({ pocket: true });
}

export function exitPocket() {
  useSession.setState({ pocket: false });
}

/** 90 → "1:30", 5400 → "1:30:00". */
export function formatRemaining(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}