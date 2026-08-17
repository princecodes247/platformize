import {
  PlatformDefinition,
  PlatformMap,
  PlatformNode,
  PlatformizeOptions,
  ResolvedPlatformConfig,
} from "./types.js";
import { getPreset } from "./presets.js";

/**
 * Normalizes a platform definition into a standard PlatformNode object.
 */
export function normalizePlatformNode(def: PlatformDefinition): PlatformNode {
  if (typeof def === "string") {
    return { extends: [def] };
  }
  if (Array.isArray(def)) {
    return { extends: def };
  }
  return {
    aliases: typeof def.aliases === "string" ? [def.aliases] : def.aliases || [],
    extends: typeof def.extends === "string" ? [def.extends] : def.extends || [],
    fallbacks: typeof def.fallbacks === "string" ? [def.fallbacks] : def.fallbacks || [],
    suffixes: typeof def.suffixes === "string" ? [def.suffixes] : def.suffixes,
  };
}

/**
 * Normalizes an entire PlatformMap into a Record<string, PlatformNode>.
 */
export function normalizePlatformMap(map: PlatformMap): Record<string, PlatformNode> {
  const result: Record<string, PlatformNode> = {};
  for (const [key, val] of Object.entries(map)) {
    result[key] = normalizePlatformNode(val);
  }
  return result;
}

/**
 * Finds canonical platform name if targetPlatform matches a platform key or alias.
 */
export function findCanonicalPlatform(
  targetPlatform: string,
  platforms: Record<string, PlatformNode>
): string {
  if (platforms[targetPlatform]) {
    return targetPlatform;
  }
  for (const [name, node] of Object.entries(platforms)) {
    if (node.aliases && Array.isArray(node.aliases) && node.aliases.includes(targetPlatform)) {
      return name;
    }
  }
  return targetPlatform;
}

/**
 * Traverses platform graph to compute ordered list of inherited and fallback platforms.
 */
export function resolvePlatformChain(
  targetPlatform: string,
  platforms: Record<string, PlatformNode>,
  globalFallbacks: string[] = []
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();

  function processPlatform(platformName: string) {
    const queue: string[] = [platformName];
    const nodeFallbacksToProcess: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      chain.push(current);

      const node = platforms[current];
      if (node) {
        if (node.extends) {
          const parents = Array.isArray(node.extends) ? node.extends : [node.extends];
          for (const parent of parents) {
            const canonicalParent = findCanonicalPlatform(parent, platforms);
            if (!platforms[canonicalParent] && !visited.has(canonicalParent)) {
              throw new Error(
                `PlatformizeError: Platform "${current}" extends unknown platform "${parent}".`
              );
            }
            if (!visited.has(canonicalParent)) {
              queue.push(canonicalParent);
            }
          }
        }
        if (node.fallbacks) {
          const fallbacks = Array.isArray(node.fallbacks) ? node.fallbacks : [node.fallbacks];
          for (const fb of fallbacks) {
            const canonicalFb = findCanonicalPlatform(fb, platforms);
            if (!visited.has(canonicalFb)) {
              nodeFallbacksToProcess.push(canonicalFb);
            }
          }
        }
      }
    }

    for (const fb of nodeFallbacksToProcess) {
      if (!visited.has(fb)) {
        processPlatform(fb);
      }
    }
  }

  processPlatform(targetPlatform);

  for (const fb of globalFallbacks) {
    const canonicalFb = findCanonicalPlatform(fb, platforms);
    if (!visited.has(canonicalFb)) {
      processPlatform(canonicalFb);
    }
  }

  return chain;
}

/**
 * Prepares resolved platform configuration including suffix order.
 */
export function createResolvedConfig(options: PlatformizeOptions = {}): ResolvedPlatformConfig {
  const presetPlatforms = options.preset ? getPreset(options.preset) : {};
  const rawPlatforms: PlatformMap = {
    ...presetPlatforms,
    ...(options.platforms || {}),
  };

  const platforms = normalizePlatformMap(rawPlatforms);

  // Default target platform if not explicitly passed: try process.platform mapping or 'macos'
  let targetPlatform = options.targetPlatform;
  if (!targetPlatform) {
    if (typeof process !== "undefined" && process.env && process.env.PLATFORM) {
      targetPlatform = process.env.PLATFORM;
    }

    if (!targetPlatform && typeof process !== "undefined" && process.platform) {
      targetPlatform = process.platform;
    }
  }
  targetPlatform = targetPlatform || "macos";

  const canonicalPlatform = findCanonicalPlatform(targetPlatform, platforms);

  const isStrict = options.strict !== false;
  const knownPlatformKeys = Object.keys(platforms);
  if (isStrict && knownPlatformKeys.length > 0) {
    if (!platforms[canonicalPlatform]) {
      const validNamesAndAliases = new Set<string>();
      for (const [name, node] of Object.entries(platforms)) {
        validNamesAndAliases.add(name);
        if (node.aliases) {
          for (const alias of node.aliases) validNamesAndAliases.add(alias);
        }
      }
      throw new Error(
        `PlatformizeError: Target platform "${targetPlatform}" is not defined in the configured platforms or preset. Valid platforms: ${Array.from(validNamesAndAliases)
          .map((k) => `"${k}"`)
          .join(", ")}.`
      );
    }
  }

  const globalFallbacks =
    typeof options.fallbacks === "string" ? [options.fallbacks] : options.fallbacks || [];

  const chain = resolvePlatformChain(canonicalPlatform, platforms, globalFallbacks);

  // Compute suffixes for each platform in chain
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

  const prefixes = options.prefixes || [".", "/", "@", "~"];

  return {
    platform: canonicalPlatform,
    platforms,
    chain,
    suffixes,
    rules: options.rules || [],
    prefixes,
  };
}
