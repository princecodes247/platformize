import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getModuleSuffixes,
  generateTsConfigPatch,
  updateTsConfigFile,
  stripJsonComments,
} from "../packages/typescript/src/index.js";

describe("@platformize/typescript", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "platformize-ts-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

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

  it("strips comments and trailing commas correctly", () => {
    const jsonc = `
    // Top-level comment
    {
      /* Multi-line
         comment */
      "compilerOptions": {
        "target": "ES2022", // inline comment
        "jsx": "react-jsx",
      },
      "include": ["src/**/*"],
    }
    `;
    const cleaned = stripJsonComments(jsonc);
    const parsed = JSON.parse(cleaned);
    expect(parsed.compilerOptions.target).toBe("ES2022");
    expect(parsed.compilerOptions.jsx).toBe("react-jsx");
    expect(parsed.include).toEqual(["src/**/*"]);
  });

  it("updates tsconfig.json on disk while preserving existing options and comments", () => {
    const tsconfigPath = path.join(tmpDir, "tsconfig.json");
    const initialContent = `
    // Main config
    {
      "compilerOptions": {
        "target": "ES2022",
        "strict": true,
      },
      "include": ["src/**/*"],
    }
    `;
    fs.writeFileSync(tsconfigPath, initialContent, "utf-8");

    const result = updateTsConfigFile(tsconfigPath, { preset: "tauri", targetPlatform: "macos" });
    expect(result.updated).toBe(true);

    const updatedContent = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    expect(updatedContent.compilerOptions.target).toBe("ES2022");
    expect(updatedContent.compilerOptions.strict).toBe(true);
    expect(updatedContent.compilerOptions.moduleSuffixes).toEqual([".macos", ".desktop", ".native", ""]);
    expect(updatedContent.include).toEqual(["src/**/*"]);
  });
});
