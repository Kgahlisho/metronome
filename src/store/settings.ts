import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BEAT_PATTERN_MAX_LENGTH,
  DEFAULT_BEAT_PATTERN,
  type BeatAccent,
  type SoundPreset,
} from "expo-precision-metronome";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clampBpm } from "../lib/tempo";

export type HapticsMode = "off" | "downbeat" | "every";

export type Preset = {
  id: string;
  name: string;
  bpm: number;
  pattern: BeatAccent[];
  sound: SoundPreset;
};

type SettingsState = {
  bpm: number;
  pattern: BeatAccent[];
  sound: SoundPreset;
  hapticsMode: HapticsMode;
  keepAwake: boolean;
  /** Keep playing in the background (Android foreground service / iOS audio mode). */
  background: boolean;
  /** Duck other apps' audio instead of interrupting it. */
  mixWithOthers: boolean;
  presets: Preset[];

  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  setPattern: (pattern: BeatAccent[]) => void;
  cycleBeat: (index: number) => void;
  addBeat: () => void;
  removeBeat: () => void;
  setSound: (sound: SoundPreset) => void;
  setHapticsMode: (mode: HapticsMode) => void;
  setKeepAwake: (value: boolean) => void;
  setBackground: (value: boolean) => void;
  setMixWithOthers: (value: boolean) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
};

const NEXT_ACCENT: Record<BeatAccent, BeatAccent> = {
  strong: "normal",
  normal: "muted",
  muted: "strong",
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      bpm: 100,
      pattern: [...DEFAULT_BEAT_PATTERN],
      sound: "click",
      hapticsMode: "downbeat",
      keepAwake: true,
      background: true,
      mixWithOthers: false,
      presets: [],

      setBpm: (bpm) => set({ bpm: clampBpm(bpm) }),
      nudgeBpm: (delta) => set({ bpm: clampBpm(get().bpm + delta) }),
      setPattern: (pattern) =>
        set({ pattern: pattern.slice(0, BEAT_PATTERN_MAX_LENGTH) }),
      cycleBeat: (index) =>
        set({
          pattern: get().pattern.map((a, i) =>
            i === index ? NEXT_ACCENT[a] : a,
          ),
        }),
      addBeat: () => {
        const { pattern } = get();
        if (pattern.length < BEAT_PATTERN_MAX_LENGTH)
          set({ pattern: [...pattern, "normal"] });
      },
      removeBeat: () => {
        const { pattern } = get();
        if (pattern.length > 1) set({ pattern: pattern.slice(0, -1) });
      },
      setSound: (sound) => set({ sound }),
      setHapticsMode: (hapticsMode) => set({ hapticsMode }),
      setKeepAwake: (keepAwake) => set({ keepAwake }),
      setBackground: (background) => set({ background }),
      setMixWithOthers: (mixWithOthers) => set({ mixWithOthers }),

      savePreset: (name) => {
        const { bpm, pattern, sound, presets } = get();
        const trimmed = name.trim() || `Preset ${presets.length + 1}`;
        set({
          presets: [
            ...presets,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: trimmed,
              bpm,
              pattern: [...pattern],
              sound,
            },
          ],
        });
      },
      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (preset)
          set({
            bpm: preset.bpm,
            pattern: [...preset.pattern],
            sound: preset.sound,
          });
      },
      deletePreset: (id) =>
        set({ presets: get().presets.filter((p) => p.id !== id) }),
    }),
    {
      name: "metronome-settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Common time signatures as accent patterns. */
export const TIME_SIGNATURES: { label: string; pattern: BeatAccent[] }[] = [
  { label: "2/4", pattern: ["strong", "normal"] },
  { label: "3/4", pattern: ["strong", "normal", "normal"] },
  { label: "4/4", pattern: ["strong", "normal", "normal", "normal"] },
  { label: "5/4", pattern: ["strong", "normal", "normal", "normal", "normal"] },
  {
    label: "6/8",
    pattern: ["strong", "muted", "muted", "normal", "muted", "muted"],
  },
  {
    label: "7/8",
    pattern: ["strong", "muted", "normal", "muted", "normal", "muted", "muted"],
  },
];
