import { ResolvedPlatformConfig } from "./types.js";
import { resolvePlatformChain } from "./graph.js";

/**
 * Helper to compute suffixes for a platform chain given normalized platform nodes.
 */
export function computeSuffixesForChain(chain: string[], platforms: Record<string, any>): string[] {
  const suffixes: string[] = [];
  for (const platformName of chain) {
    const node = platforms[platformName];
    if (node && node.suffixes && (Array.isArray(node.suffixes) ? node.suffixes.length > 0 : true)) {
      const customSuffixes = Array.isArray(node.suffixes) ? node.suffixes : [node.suffixes];
      for (const s of customSuffixes) {
        const formatted = s.startsWith(".") ? s : `.${s}`;
        if (!suffixes.includes(formatted)) {
          suffixes.push(formatted);
        }
      }
    } else {
      const defaultSuffix = `.${platformName}`;
      if (!suffixes.includes(defaultSuffix)) {
        suffixes.push(defaultSuffix);
      }
    }
  }
  suffixes.push("");
  return suffixes;
}

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
      const isMatch = (target: string) =>
        typeof rule.include === "string"
          ? target.includes(rule.include)
          : rule.include!.test(target);
      matches = isMatch(source) || (importer ? isMatch(importer) : false);
    }

    if (!matches) continue;

    if (rule.exclude) {
      const isExcluded = (target: string) =>
        typeof rule.exclude === "string"
          ? target.includes(rule.exclude)
          : rule.exclude!.test(target);
      if (isExcluded(source) || (importer ? isExcluded(importer) : false)) {
        continue;
      }
    }

    // Rule matches, compute new suffixes
    if (rule.getChain) {
      const customChain = rule.getChain(source, importer, config.platform);
      return computeSuffixesForChain(customChain, config.platforms);
    } else if (rule.platform) {
      const customChain = resolvePlatformChain(rule.platform, config.platforms, []);
      return computeSuffixesForChain(customChain, config.platforms);
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
  for (const node of Object.values(config.platforms)) {
    if (node.aliases) {
      const aliases = Array.isArray(node.aliases) ? node.aliases : [node.aliases];
      for (const a of aliases) {
        platforms.add(a);
      }
    }
    if (node.suffixes) {
      const suffixes = Array.isArray(node.suffixes) ? node.suffixes : [node.suffixes];
      for (const s of suffixes) {
        const clean = s.startsWith(".") ? s.slice(1) : s;
        if (clean) platforms.add(clean);
      }
    }
  }
  return platforms;
}

/**
 * Checks if a path specifier already explicitly includes a recognized platform suffix.
 * e.g., "./Button.windows" or "./FileSystem.macos.ts" -> true
 */
export function hasExplicitPlatformSuffix(source: string, knownPlatforms: Set<string>): boolean {
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
  // Ignore virtual modules, Vite-internal paths, node_modules, and .vite cache
  if (
    source.startsWith("\0") ||
    source.startsWith("/@") ||
    source.includes("node_modules") ||
    source.includes(".vite/")
  ) {
    return false;
  }
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
