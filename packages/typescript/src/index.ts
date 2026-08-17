import fs from "node:fs";
import path from "node:path";
import { PlatformizeOptions, createResolvedConfig } from "@platformize/core";

/**
 * Returns TypeScript moduleSuffixes array for the target platform configuration.
 * e.g., [".macos", ".desktop", ".native", ""]
 */
export function getModuleSuffixes(options: PlatformizeOptions = {}): string[] {
  const config = createResolvedConfig(options);
  return config.suffixes;
}

/**
 * Generates partial compilerOptions JSON object containing moduleSuffixes.
 */
export function generateTsConfigPatch(options: PlatformizeOptions = {}) {
  return {
    compilerOptions: {
      moduleSuffixes: getModuleSuffixes(options),
    },
  };
}

/**
 * Updates a tsconfig.json file on disk with current platform moduleSuffixes.
 */
export function updateTsConfigFile(
  tsconfigPath: string,
  options: PlatformizeOptions = {}
): { updated: boolean; suffixes: string[] } {
  const resolvedPath = path.resolve(tsconfigPath);
  let rawJson = "{}";

  if (fs.existsSync(resolvedPath)) {
    rawJson = fs.readFileSync(resolvedPath, "utf-8");
  }

  let parsed: Record<string, any> = {};
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    parsed = {};
  }

  if (!parsed.compilerOptions) {
    parsed.compilerOptions = {};
  }

  const suffixes = getModuleSuffixes(options);
  parsed.compilerOptions.moduleSuffixes = suffixes;

  fs.writeFileSync(resolvedPath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");

  return {
    updated: true,
    suffixes,
  };
}
