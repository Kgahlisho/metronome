import type { RefObject } from "react";
import type { View } from "react-native";
import { create } from "zustand";

type Origin = { x: number; y: number } | null;

type OverlayStore = {
  /** Whether the full-screen beat view is open. */
  expanded: boolean;
  /** Window coordinates of the circle's centre the view grows from. */
  origin: Origin;
};

export const useOverlay = create<OverlayStore>(() => ({
  expanded: false,
  origin: null,
}));

let pulseRef: RefObject<View | null> | null = null;

/** The home-screen circle registers itself so the overlay can grow from it. */
export function registerPulse(ref: RefObject<View | null> | null) {
  pulseRef = ref;
}

/** Open the full-screen view, growing from the circle's current position. */
export function expandOverlay() {
  const view = pulseRef?.current;
  if (!view) {
    useOverlay.setState({ expanded: true, origin: null });
    return;
  }
  view.measureInWindow((x, y, w, h) => {
    useOverlay.setState({
      expanded: true,
      origin: { x: x + w / 2, y: y + h / 2 },
    });
  });
}

/** Shrink back to the circle. Playback is not affected. */
export function collapseOverlay() {
  useOverlay.setState({ expanded: false });
}