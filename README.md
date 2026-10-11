# Metronome

React Native (Expo) metronome with native, sample-accurate audio timing.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK 57, React Native 0.86, TypeScript |
| Audio engine | [`expo-precision-metronome`](https://www.npmjs.com/package/expo-precision-metronome) — beats scheduled natively (AVAudioEngine on iOS, Oboe on Android), so JS thread load can't cause jitter |
| Navigation | Expo Router (`src/app`) |
| State | Zustand, persisted with AsyncStorage |
| Haptics / wake lock | `expo-haptics`, `expo-keep-awake` |

## Features

- Tempo 20–300 BPM: ±1 / ±5 steps, tap tempo, Italian tempo marking
- Time signatures (2/4 … 7/8) and a custom accent editor (1–16 beats, each strong / normal / muted)
- 6 built-in sounds, switchable live without stopping
- Background playback (Android notification with Pause/Stop controls; iOS audio mode)
- Mix with other audio (ducks a backing track instead of stopping it)
- Haptic beats (off / downbeat / every beat), keep-screen-awake option
- Saved presets (tempo + pattern + sound)
- Accessibility: 48dp touch targets, screen-reader labels, tempo exposed as an adjustable control (swipe up/down), reduced-motion support

## Requirements

- Node 20.19.4+ (22 LTS works)
- Android Studio (Android SDK) and/or Xcode (macOS only)
- **A development build is required.** The audio engine is native code and does not run in Expo Go.

## Run it

```sh
npm install
npx expo run:android      # or: npx expo run:ios
```

The first run generates `android/` / `ios/` (prebuild), compiles the native app and installs it on a device or emulator. After that, day-to-day work is:

```sh
npm start                 # starts Metro for the dev build
```

Use `npm run typecheck` to type-check. If you don't have Android Studio or Xcode, you can build in the cloud with EAS: `npx eas-cli@latest build --profile development --platform android`.

> Test on a **real device** for timing and background behaviour — emulators and simulators hide both.

## VS Code

Open the folder and accept the recommended extensions: **Expo Tools**, **React Native Tools**, **ESLint**, **Prettier**.

## Project layout

```
src/
  app/          screens: index (Play), presets, settings, _layout (tabs)
  audio/        engine.ts — native engine wrapper, playback store, live sync
  components/   TempoControl, BeatRow, Pulse, Segmented, Button
  store/        settings.ts — persisted settings and presets
  lib/          theme.ts, tempo.ts (tap tempo, clamping, markings)
```

## Notes

- `app.json` uses placeholder IDs (`com.example.metronome`). Change them before publishing.
- Background playback needs the config plugin already enabled in `app.json`; iOS App Review expects apps using the audio background mode to really need it.
- Swiping the app out of recents stops the metronome (the engine lives with the JS context).
