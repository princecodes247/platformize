import fs from "node:fs";
import path from "node:path";
import { createResolvedConfig, getAllKnownPlatforms } from "@platformize/core";
import { runResolve } from "./resolve.js";

export interface CheckOptions {
  platform?: string;
  preset?: string;
  cwd?: string;
  dir?: string;
}

export function runCheck(options: CheckOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const searchDir = path.resolve(cwd, options.dir || "src");
  const platform = options.platform || "macos";
  const preset = options.preset || "tauri";

  const config = createResolvedConfig({ platform, preset });
  const knownPlatforms = getAllKnownPlatforms(config);

  console.log("Platformize\n");
  console.log(`Platform: ${config.platform}`);
  console.log(`Fallback chain: ${config.chain.join(" -> ")} -> base\n`);

  if (!fs.existsSync(searchDir)) {
    console.log(`Directory not found: ${searchDir}`);
    return;
  }

  // Scan directory for base files (e.g. Button.tsx, filesystem.ts)
  const files: string[] = [];
  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.isFile()) {
        // filter out platform-specific variants when collecting base modules
        const name = entry.name;
        let isVariant = false;
        for (const p of knownPlatforms) {
          if (name.includes(`.${p}.`)) {
            isVariant = true;
            break;
          }
        }
        if (!isVariant && /\.(tsx?|jsx?)$/i.test(name)) {
          files.push(full);
        }
      }
    }
  }

  scan(searchDir);

  for (const file of files) {
    const rel = path.relative(cwd, file);
    const specifier = `./${rel.replace(/\.(tsx?|jsx?)$/, "")}`;
    const resolved = runResolve({ specifier, platform, preset, cwd });

    if (resolved) {
      if (resolved.includes(`.${platform}.`)) {
        console.log(`✓ ${resolved}`);
      } else {
        const resolvedBase = path.basename(resolved);
        const specBase = path.basename(file);
        if (resolvedBase !== specBase) {
          console.log(`✓ ${resolved} (via fallback)`);
        } else {
          console.log(`⚠ ${file} not specialized for ${platform}`);
          console.log(`  Using ${resolved}`);
        }
      }
    } else {
      console.log(`❌ ${specifier} could not be resolved`);
    }
  }
}
