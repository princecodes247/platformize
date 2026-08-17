import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runResolve } from "../packages/cli/src/commands/resolve.js";
import { runInit } from "../packages/cli/src/commands/init.js";

describe("@platformize/cli", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "platformize-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves platform specific files correctly", () => {
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, "Button.tsx"), "export default 'base';");
    fs.writeFileSync(path.join(srcDir, "Button.macos.tsx"), "export default 'macos';");
    fs.writeFileSync(path.join(srcDir, "Button.windows.tsx"), "export default 'windows';");

    const macosResult = runResolve({
      specifier: "./src/Button",
      platform: "macos",
      preset: "tauri",
      cwd: tmpDir,
    });
    expect(macosResult).toBe("./src/Button.macos.tsx");

    const winResult = runResolve({
      specifier: "./src/Button",
      platform: "windows",
      preset: "tauri",
      cwd: tmpDir,
    });
    expect(winResult).toBe("./src/Button.windows.tsx");

    const linuxResult = runResolve({
      specifier: "./src/Button",
      platform: "linux",
      preset: "tauri",
      cwd: tmpDir,
    });
    expect(linuxResult).toBe("./src/Button.tsx");
  });

  it("updates tsconfig.json during init", () => {
    const tsconfigPath = path.join(tmpDir, "tsconfig.json");
    fs.writeFileSync(tsconfigPath, JSON.stringify({ compilerOptions: {} }, null, 2));

    runInit({ cwd: tmpDir, preset: "tauri", platform: "macos" });

    const content = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    expect(content.compilerOptions.moduleSuffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });
});
