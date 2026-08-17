import { ResolvedPlatformConfig } from "./types.js";

/**
 * Known platform suffixes present in config/preset.
 */
export function getAllKnownPlatforms(config: ResolvedPlatformConfig): Set<string> {
  const platforms = new Set<string>(Object.keys(config.platforms));
  for (const item of config.chain) {
    platforms.add(item);
  }
  return platforms;
}

/**
 * Checks if a path specifier already explicitly includes a recognized platform suffix.
 * e.g., "./Button.windows" or "./FileSystem.macos.ts" -> true
 */
export function hasExplicitPlatformSuffix(
  source: string,
  knownPlatforms: Set<string>
): boolean {
  // Remove known extensions if present (e.g., .ts, .tsx, .js, .jsx, .json)
  const cleanSource = source.replace(/\.(tsx?|jsx?|json|mjs|cjs|vue|svelte)$/i, "");
  
  for (const platform of knownPlatforms) {
    if (cleanSource.endsWith(`.${platform}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether an import specifier should be resolved by Platformize.
 * Ignores node_modules / bare specifiers (unless explicitly relative or alias matched).
 */
export function isEligibleSpecifier(source: string): boolean {
  if (!source) return false;
  // Ignore virtual modules or Vite-internal paths
  if (source.startsWith("\0") || source.startsWith("/@")) return false;
  // Ignore absolute URLs (http, https, etc)
  if (/^[a-z]+:/i.test(source)) return false;
  // Default rule for relative paths or root-relative paths
  return source.startsWith(".") || source.startsWith("/");
}

export interface CandidateSpecifier {
  candidate: string;
  suffix: string;
}

/**
 * Generates candidate specifiers for an import request given the ordered resolution suffixes.
 * Preserves existing file extension if specifier includes one, or appends platform suffix directly.
 */
export function getCandidateSpecifiers(
  source: string,
  suffixes: string[],
  knownPlatforms: Set<string>
): CandidateSpecifier[] {
  if (hasExplicitPlatformSuffix(source, knownPlatforms)) {
    return [{ candidate: source, suffix: "" }];
  }

  // Match optional file extension
  const extMatch = source.match(/(\.(tsx?|jsx?|json|mjs|cjs|vue|svelte))$/i);
  const ext = extMatch ? extMatch[1] : "";
  const basePath = ext ? source.slice(0, -ext.length) : source;

  return suffixes.map((suffix) => {
    if (!suffix) {
      return { candidate: source, suffix: "" };
    }
    return {
      candidate: `${basePath}${suffix}${ext}`,
      suffix,
    };
  });
}
