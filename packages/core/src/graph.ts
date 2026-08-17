import { PlatformMap, PlatformizeOptions, ResolvedPlatformConfig } from "./types.js";
import { getPreset } from "./presets.js";

/**
 * Traverses platform graph to compute ordered list of inherited platforms.
 * Uses BFS/DFS with cycle detection and deduplication preserving left-to-right order.
 */
export function resolvePlatformChain(
  targetPlatform: string,
  platforms: PlatformMap,
  explicitFallbacks: string[] = []
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = [targetPlatform, ...explicitFallbacks];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    chain.push(current);

    const node = platforms[current];
    if (node && node.extends) {
      for (const parent of node.extends) {
        if (!platforms[parent] && !visited.has(parent)) {
          throw new Error(
            `PlatformizeError: Platform "${current}" extends unknown platform "${parent}".`
          );
        }
        if (!visited.has(parent)) {
          queue.push(parent);
        }
      }
    }
  }

  return chain;
}

/**
 * Prepares resolved platform configuration including suffix order.
 * Output suffixes e.g.: [".macos", ".desktop", ".native", ""]
 */
export function createResolvedConfig(options: PlatformizeOptions = {}): ResolvedPlatformConfig {
  const presetPlatforms = options.preset ? getPreset(options.preset) : {};
  const platforms: PlatformMap = {
    ...presetPlatforms,
    ...(options.platforms || {}),
  };

  // Default target platform if not explicitly passed: try process.platform mapping or 'macos'
  let targetPlatform = options.platform;
  if (!targetPlatform) {
    if (typeof process !== "undefined" && process.platform) {
      if (process.platform === "darwin") targetPlatform = "macos";
      else if (process.platform === "win32") targetPlatform = "windows";
      else if (process.platform === "linux") targetPlatform = "linux";
    }
  }
  targetPlatform = targetPlatform || "macos";

  const chain = resolvePlatformChain(targetPlatform, platforms, options.fallbacks || []);
  const suffixes = [...chain.map((p) => `.${p}`), ""];

  return {
    platform: targetPlatform,
    platforms,
    chain,
    suffixes,
  };
}
