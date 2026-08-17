export interface PlatformNode {
  extends?: string[];
}

export type PlatformMap = Record<string, PlatformNode>;

export type PresetName = "tauri" | string;

export interface PlatformizeOptions {
  /**
   * The target platform for resolution (e.g., 'macos', 'windows', 'linux').
   */
  platform?: string;

  /**
   * Built-in preset to use, e.g. 'tauri'.
   */
  preset?: PresetName;

  /**
   * Custom platform inheritance graph definitions.
   */
  platforms?: PlatformMap;

  /**
   * Additional explicit fallback platforms appended to the resolution chain.
   */
  fallbacks?: string[];
}

export interface ResolvedPlatformConfig {
  platform: string;
  platforms: PlatformMap;
  chain: string[];
  suffixes: string[];
}
