import { describe, it, expect } from "vitest";
import { getModuleSuffixes, generateTsConfigPatch } from "../packages/typescript/src/index.js";

describe("@platformize/typescript", () => {
  it("generates correct moduleSuffixes for macos target", () => {
    const suffixes = getModuleSuffixes({ preset: "tauri", targetPlatform: "macos" });
    expect(suffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });

  it("generates correct moduleSuffixes for windows target", () => {
    const suffixes = getModuleSuffixes({ preset: "tauri", targetPlatform: "windows" });
    expect(suffixes).toEqual([".windows", ".desktop", ".native", ""]);
  });

  it("creates tsconfig patch object", () => {
    const patch = generateTsConfigPatch({ preset: "tauri", targetPlatform: "linux" });
    expect(patch).toEqual({
      compilerOptions: {
        moduleSuffixes: [".linux", ".desktop", ".native", ""],
      },
    });
  });
});
