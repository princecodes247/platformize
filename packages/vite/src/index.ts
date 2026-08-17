
import {
  PlatformizeOptions,
  createResolvedConfig,
  getAllKnownPlatforms,
  getCandidateSpecifiers,
  isEligibleSpecifier,
  hasExplicitPlatformSuffix,
  evaluateRules,
} from "@platformize/core";
import { PluginOption } from "vite";

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
} {
  const config = createResolvedConfig(options);
  const knownPlatforms = getAllKnownPlatforms(config);

  return {
    name: "platformize",
    enforce: "pre",

    async resolveId(source: string, importer: string | undefined, resolveOptions) {
      // Avoid recursive loops or handling ineligible imports
      if (!source || !isEligibleSpecifier(source)) {
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
