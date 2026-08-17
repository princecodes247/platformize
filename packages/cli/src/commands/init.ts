import fs from "node:fs";
import path from "node:path";
import { updateTsConfigFile } from "@platformize/typescript";

export interface InitOptions {
  preset?: string;
  platform?: string;
  cwd?: string;
}

export function runInit(options: InitOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const preset = options.preset || "tauri";
  const targetPlatform = options.platform || "macos";

  console.log(`Initializing Platformize project in ${cwd}...`);
  console.log(`Preset: ${preset}`);
  console.log(`Platform: ${targetPlatform}`);

  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    const result = updateTsConfigFile(tsconfigPath, { preset, targetPlatform });
    console.log(`✓ Updated tsconfig.json moduleSuffixes: ${JSON.stringify(result.suffixes)}`);
  } else {
    console.log(`⚠ tsconfig.json not found in ${cwd}, skipping tsconfig update.`);
  }

  console.log("\nSetup complete! Ensure your vite.config.ts includes:");
  console.log(`
import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      preset: "${preset}"
    })
  ]
});
  `);
}
