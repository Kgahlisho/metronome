import { BPM_MAX, BPM_MIN } from "expo-precision-metronome";

export function clampBpm(bpm: number): number {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

const MARKINGS: [number, string][] = [
  [40, "Grave"],
  [60, "Largo"],
  [66, "Larghetto"],
  [76, "Adagio"],
  [108, "Andante"],
  [120, "Moderato"],
  [156, "Allegro"],
  [176, "Vivace"],
  [200, "Presto"],
  [Infinity, "Prestissimo"],
];

/** Italian tempo marking for a BPM value. */
export function tempoMarking(bpm: number): string {
  return MARKINGS.find(([max]) => bpm < max)?.[1] ?? "Prestissimo";
}

const TAP_RESET_MS = 2000;
const TAP_WINDOW = 5;

/**
 * Tap tempo: keeps the last few tap times and averages the intervals.
 * A pause longer than 2 s starts a new measurement.
 */
export function createTapTempo() {
  let taps: number[] = [];
  return {
    tap(now: number = Date.now()): number | null {
      if (taps.length && now - taps[taps.length - 1] > TAP_RESET_MS) taps = [];
      taps.push(now);
      taps = taps.slice(-TAP_WINDOW);
      if (taps.length < 2) return null;
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      return clampBpm(60000 / avg);
    },
    reset() {
      taps = [];
    },
  };
}
