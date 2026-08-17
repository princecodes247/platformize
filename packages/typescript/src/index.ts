import fs from "node:fs";
import path from "node:path";
import { PlatformizeOptions, createResolvedConfig } from "@platformize/core";

/**
 * Strips comments and trailing commas from JSON string (JSONC) so standard JSON.parse can read tsconfig files.
 */
export function stripJsonComments(jsonString: string): string {
  return jsonString
    .replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, stringMatch) =>
      stringMatch ? stringMatch : ""
    )
    .replace(/,(\s*[\}\]])/g, "$1");
}

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
 * Preserves all existing compilerOptions, target, lib, include, etc. even if the file contains comments.
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
    const cleaned = stripJsonComments(rawJson);
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {};
  }

  if (!parsed.compilerOptions) {
    parsed.compilerOptions = {};
  }

  const suffixes = getModuleSuffixes(options);

  // Check if moduleSuffixes already matches
  const existingSuffixes = parsed.compilerOptions.moduleSuffixes;
  if (
    Array.isArray(existingSuffixes) &&
    JSON.stringify(existingSuffixes) === JSON.stringify(suffixes)
  ) {
    return {
      updated: false,
      suffixes,
    };
  }

  parsed.compilerOptions.moduleSuffixes = suffixes;

  fs.writeFileSync(resolvedPath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");

  return {
    updated: true,
    suffixes,
  };
}
