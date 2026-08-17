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
   * The active target platform for this build (e.g., "macos", "ios").
   * If omitted, Platformize auto-detects via standard environment variables.
   * 
   * @example "windows"
   */
  targetPlatform?: string;

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

  /**
   * Print active platform and fallback chain to console when Vite starts.
   * Defaults to false.
   */
  verbose?: boolean;

  /**
   * Automatically update tsconfig.json moduleSuffixes to match the active platform chain when Vite starts.
   * Defaults to true.
   */
  autoSyncTsConfig?: boolean;
}

export interface ResolvedPlatformConfig {
  platform: string;
  platforms: PlatformMap;
  chain: string[];
  suffixes: string[];
  rules: Rule[];
  prefixes: string[];
}
