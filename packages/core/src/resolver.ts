import { ResolvedPlatformConfig, Rule } from "./types.js";
import { resolvePlatformChain } from "./graph.js";

/**
 * Evaluates custom resolution rules against the source and importer.
 * Returns overridden suffixes if a rule matches, otherwise returns default suffixes.
 */
export function evaluateRules(
  source: string,
  importer: string | undefined,
  config: ResolvedPlatformConfig
): string[] {
  if (!config.rules || config.rules.length === 0) {
    return config.suffixes;
  }

  for (const rule of config.rules) {
    let matches = false;

    if (rule.test) {
      matches = rule.test(source, importer);
    } else if (rule.include) {
      const isMatch = (target: string) => typeof rule.include === "string" ? target.includes(rule.include) : rule.include!.test(target);
      matches = isMatch(source) || (importer ? isMatch(importer) : false);
    }

    if (!matches) continue;

    if (rule.exclude) {
      const isExcluded = (target: string) => typeof rule.exclude === "string" ? target.includes(rule.exclude) : rule.exclude!.test(target);
      if (isExcluded(source) || (importer ? isExcluded(importer) : false)) {
        continue;
      }
    }

    // Rule matches, compute new suffixes
    if (rule.getChain) {
      const customChain = rule.getChain(source, importer, config.platform);
      return [...customChain.map((p) => `.${p}`), ""];
    } else if (rule.platform) {
      const customChain = resolvePlatformChain(rule.platform, config.platforms, []);
      return [...customChain.map((p) => `.${p}`), ""];
    }
  }

  return config.suffixes;
}

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
  for (const platform of knownPlatforms) {
    // Matches .platform at the end of the string, optionally followed by an extension
    const regex = new RegExp(`\\.${platform}(\\.[^./]+)?$`);
    if (regex.test(source)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether an import specifier should be resolved by Platformize.
 * Ignores node_modules / bare specifiers (unless explicitly relative or alias matched).
 */
export function isEligibleSpecifier(source: string, prefixes: string[]): boolean {
  if (!source) return false;
  // Ignore virtual modules or Vite-internal paths
  if (source.startsWith("\0") || source.startsWith("/@")) return false;
  // Ignore absolute URLs (http, https, etc)
  if (/^[a-z]+:/i.test(source)) return false;
  // Default rule for relative paths or root-relative paths or aliases
  for (const prefix of prefixes) {
    if (source.startsWith(prefix)) return true;
  }
  return false;
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

  // Match optional file extension dynamically
  const extMatch = source.match(/(\.[^./]+)$/);
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
