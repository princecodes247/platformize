import { updateTsConfigFile } from "@platformize/typescript";
import {
  PlatformizeOptions,
  createResolvedConfig,
  getAllKnownPlatforms,
  getCandidateSpecifiers,
  isEligibleSpecifier,
  hasExplicitPlatformSuffix,
  evaluateRules,
} from "@platformize/core";

export type { PlatformizeOptions } from "@platformize/core";

export default function platformize(options: PlatformizeOptions = {}): {
  name: string;
  enforce: "pre" | "post";
  resolveId: (
    this: any,
    source: string,
    importer: string | undefined,
    resolveOptions: {
      attributes: Record<string, string>;
      custom?: any;
      ssr?: boolean;
      isEntry: boolean;
    }
  ) => Promise<any>;
  configResolved?: (viteConfig: any) => void;
} {
  let targetPlatform = options.targetPlatform;
  if (!targetPlatform && typeof process !== "undefined" && process.env) {
    targetPlatform = process.env.VITE_PLATFORM || process.env.TAURI_ENV_PLATFORM;
  }

  const config = createResolvedConfig({
    ...options,
    targetPlatform: targetPlatform || options.targetPlatform,
  });
  const knownPlatforms = getAllKnownPlatforms(config);

  return {
    name: "platformize",
    enforce: "pre",

    configResolved(viteConfig: any) {
      if (options.verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `\x1b[36m⚡️ [Platformize]\x1b[0m Target: \x1b[32m${config.platform}\x1b[0m | Chain: \x1b[33m${config.chain.map((p) => `.${p}`).join(" -> ")}\x1b[0m`
        );
      }

      if (options.autoSyncTsConfig !== false) {
        try {
          const tsconfigPath = viteConfig.root + "/tsconfig.json";
          const { updated } = updateTsConfigFile(tsconfigPath, options);
          if (updated && options.verbose) {
            // eslint-disable-next-line no-console
            console.log(`\x1b[36m[Platformize]\x1b[0m Synced tsconfig.json moduleSuffixes`);
          }
        } catch (e) {
          // Ignore failures to sync tsconfig
        }
      }
    },

    async resolveId(source: string, importer: string | undefined, resolveOptions: any) {
      // Avoid handling node_modules or .vite dependencies or ineligible imports
      if (
        !source ||
        (importer && (importer.includes("node_modules") || importer.includes(".vite/"))) ||
        !isEligibleSpecifier(source, config.prefixes)
      ) {
        return null;
      }

      // If source already has an explicit platform suffix (e.g. ./Button.windows), pass through
      if (hasExplicitPlatformSuffix(source, knownPlatforms)) {
        return null;
      }

      const activeSuffixes = evaluateRules(source, importer, config);
      const candidates = getCandidateSpecifiers(source, activeSuffixes, knownPlatforms);

      for (const { candidate, suffix } of candidates) {
        // Skip candidate matching exact input source with empty suffix to avoid infinite recursion
        if (!suffix && candidate === source) {
          continue;
        }

        try {
          const resolved = await this.resolve(candidate, importer, {
            ...resolveOptions,
            skipSelf: true,
          });

          if (resolved) {
            return resolved;
          }
        } catch {
          // Continue trying next candidate in fallback chain
        }
      }

      return null;
    },
  };
}
