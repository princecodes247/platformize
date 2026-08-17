export type PresetName = "tauri" | string;

export interface Rule {
  /**
   * A function that determines whether this rule should apply.
   */
  test?: (source: string, importer: string | undefined) => boolean;

  /**
   * A regular expression or string to include specific files.
   */
  include?: string | RegExp;

  /**
   * A regular expression or string to exclude specific files.
   */
  exclude?: string | RegExp;

  /**
   * The platform to use if this rule matches.
   */
  platform?: string;

  /**
   * A function that dynamically generates the fallback chain if this rule matches.
   */
  getChain?: (source: string, importer: string | undefined, currentPlatform: string) => string[];
}

/**
 * Platform node configuration detailing inheritance, fallbacks, and custom suffixes.
 */
export interface PlatformNode {
  /**
   * Platform(s) this platform inherits from (resolved first in order).
   * Can be a single platform string or an array of platform strings.
   * 
   * @example "desktop"
   * @example ["desktop", "native"]
   */
  extends?: string | string[];

  /**
   * Explicit fallback platform(s) for this specific platform node (resolved after extends).
   * Can be a single platform string or an array of platform strings.
   * 
   * @example "web"
   * @example ["web", "common"]
   */
  fallbacks?: string | string[];

  /**
   * Custom file suffixes associated with this platform.
   * Defaults to `["." + platformName]`.
   * 
   * @example [".macos", ".mac", ".osx"]
   */
  suffixes?: string | string[];
}

/**
 * Shorthand platform definition:
 * - `string`: Shorthand for `{ extends: [string] }`
 * - `string[]`: Shorthand for `{ extends: string[] }`
 * - `PlatformNode`: Full node configuration
 */
export type PlatformDefinition = string | string[] | PlatformNode;

/**
 * Map of platform names to platform definitions.
 */
export type PlatformMap = Record<string, PlatformDefinition>;

export interface PlatformizeOptions {
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
   * Custom platform map definitions. Supports string shorthands or full PlatformNode objects.
   */
  platforms?: PlatformMap;

  /**
   * Global fallback platform(s) appended at the end of all resolution chains.
   */
  fallbacks?: string | string[];

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

  /**
   * Enforce strict validation that targetPlatform exists in the configured platforms map or preset.
   * Defaults to true.
   */
  strict?: boolean;

  /**
   * Custom resolution rules for context-aware or programmatic platform resolution.
   */
  rules?: Rule[];
}

export interface ResolvedPlatformConfig {
  platform: string;
  platforms: Record<string, PlatformNode>;
  chain: string[];
  suffixes: string[];
  rules: Rule[];
  prefixes: string[];
}
