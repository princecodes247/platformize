import { PlatformMap } from "./types.js";

/**
 * Tauri preset configuration:
 * macos -> desktop -> native
 * windows -> desktop -> native
 * linux -> desktop -> native
 * ios -> mobile -> native
 * android -> mobile -> native
 */
export const TAURI_PRESET: PlatformMap = {
  macos: "desktop",
  windows: "desktop",
  linux: "desktop",
  desktop: "native",
  ios: "mobile",
  android: "mobile",
  mobile: "native",
  native: [],
};

export const PRESETS: Record<string, PlatformMap> = {
  tauri: TAURI_PRESET,
};

export function getPreset(presetName: string): PlatformMap {
  const preset = PRESETS[presetName.toLowerCase()];
  if (!preset) {
    throw new Error(
      `PlatformizeError: Unknown preset "${presetName}". Supported presets: ${Object.keys(
        PRESETS
      ).join(", ")}`
    );
  }
  return preset;
}
