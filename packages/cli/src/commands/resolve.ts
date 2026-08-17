import fs from "node:fs";
import path from "node:path";
import {
  createResolvedConfig,
  getCandidateSpecifiers,
  getAllKnownPlatforms,
} from "@platformize/core";

export interface ResolveOptions {
  specifier: string;
  platform?: string;
  preset?: string;
  cwd?: string;
}

export function runResolve(options: ResolveOptions): string | null {
  const cwd = options.cwd || process.cwd();
  const config = createResolvedConfig({
    preset: options.preset || "tauri",
    targetPlatform: options.platform || "macos",
  });
  const knownPlatforms = getAllKnownPlatforms(config);

  const candidates = getCandidateSpecifiers(options.specifier, config.suffixes, knownPlatforms);
  const extensions = [".tsx", ".ts", ".jsx", ".js", ".json", ""];

  for (const { candidate } of candidates) {
    const relativePath =
      candidate.startsWith("./") || candidate.startsWith("../") ? candidate : `./${candidate}`;
    const absoluteBasePath = path.resolve(cwd, relativePath);

    for (const ext of extensions) {
      const fullPath = absoluteBasePath.endsWith(ext)
        ? absoluteBasePath
        : `${absoluteBasePath}${ext}`;

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const rel = path.relative(cwd, fullPath);
        return rel.startsWith(".") ? rel : `./${rel}`;
      }
    }
  }

  return null;
}
