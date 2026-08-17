export interface PlatformNode {
  extends?: string[];
}

export type PlatformMap = Record<string, PlatformNode>;

export type PresetName = "tauri" | string;

export interface Rule {
  test?: (source: string, importer: string | undefined) => boolean;
  include?: string | RegExp;
  exclude?: string | RegExp;
  platform?: string;
  getChain?: (source: string, importer: string | undefined, currentPlatform: string) => string[];
}

export interface PlatformizeOptions {
  /**
   * Custom resolution rules for context-aware or programmatic platform resolution.
   */
  rules?: Rule[];

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

  /**
   * Allowed module specifier prefixes to resolve (e.g., ".", "/", "@", "~").
   * Defaults to [".", "/", "@", "~"].
   */
  prefixes?: string[];
}

export interface ResolvedPlatformConfig {
  platform: string;
  platforms: PlatformMap;
  chain: string[];
  suffixes: string[];
  rules: Rule[];
  prefixes: string[];
}
