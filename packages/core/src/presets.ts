import { PlatformMap } from "./types.js";

/**
 * Tauri preset configuration:
 * macos (aliases: darwin, mac) -> desktop -> native
 * windows (aliases: win32, win) -> desktop -> native
 * linux -> desktop -> native
 * ios -> mobile -> native
 * android -> mobile -> native
 */
export const TAURI_PRESET: PlatformMap = {
  macos: {
    aliases: ["darwin", "mac"],
    extends: "desktop",
  },
  windows: {
    aliases: ["win32", "win"],
    extends: "desktop",
  },
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
