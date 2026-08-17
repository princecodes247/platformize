import { PlatformMap } from "./types.js";

/**
 * Tauri preset configuration:
 * macos -> [desktop, native]
 * windows -> [desktop, native]
 * linux -> [desktop, native]
 * desktop -> [native]
 * native -> []
 */
export const TAURI_PRESET: PlatformMap = {
  macos: {
    extends: ["desktop", "native"],
  },
  windows: {
    extends: ["desktop", "native"],
  },
  linux: {
    extends: ["desktop", "native"],
  },
  desktop: {
    extends: ["native"],
  },
  native: {
    extends: [],
  },
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
