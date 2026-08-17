import { describe, it, expect } from "vitest";
import {
  createResolvedConfig,
  getCandidateSpecifiers,
  getAllKnownPlatforms,
  hasExplicitPlatformSuffix,
  resolvePlatformChain,
  isEligibleSpecifier,
  TAURI_PRESET,
} from "../packages/core/src/index.js";

describe("@platformize/core", () => {
  it("resolves inheritance chain for Tauri preset macos target", () => {
    const chain = resolvePlatformChain("macos", TAURI_PRESET);
    expect(chain).toEqual(["macos", "desktop", "native"]);
  });

  it("generates suffixes in expected order for macos", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "macos" });
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });

  it("auto-detects platform from environment variables if not provided", () => {
    process.env.PLATFORM = "linux";
    const config = createResolvedConfig({ preset: "tauri" });
    expect(config.platform).toBe("linux");
    expect(config.suffixes).toEqual([".linux", ".desktop", ".native", ""]);
    delete process.env.PLATFORM;
  });

  it("generates candidate specifiers without explicit suffix", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "macos" });
    const known = getAllKnownPlatforms(config);
    const candidates = getCandidateSpecifiers("./Button", config.suffixes, known);

    expect(candidates).toEqual([
      { candidate: "./Button.macos", suffix: ".macos" },
      { candidate: "./Button.desktop", suffix: ".desktop" },
      { candidate: "./Button.native", suffix: ".native" },
      { candidate: "./Button", suffix: "" },
    ]);
  });

  it("preserves extensions when generating candidates", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "windows" });
    const known = getAllKnownPlatforms(config);
    const candidates = getCandidateSpecifiers("./Button.tsx", config.suffixes, known);

    expect(candidates).toEqual([
      { candidate: "./Button.windows.tsx", suffix: ".windows" },
      { candidate: "./Button.desktop.tsx", suffix: ".desktop" },
      { candidate: "./Button.native.tsx", suffix: ".native" },
      { candidate: "./Button.tsx", suffix: "" },
    ]);
  });

  it("detects explicit platform suffix to prevent double suffixing", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "macos" });
    const known = getAllKnownPlatforms(config);

    expect(hasExplicitPlatformSuffix("./Button.windows", known)).toBe(true);
    expect(hasExplicitPlatformSuffix("./Button.windows.tsx", known)).toBe(true);
    expect(hasExplicitPlatformSuffix("./Button", known)).toBe(false);

    const candidates = getCandidateSpecifiers("./Button.windows.tsx", config.suffixes, known);
    expect(candidates).toEqual([{ candidate: "./Button.windows.tsx", suffix: "" }]);
  });

  it("preserves non-JS extensions (like .css or .png) dynamically", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "macos" });
    const known = getAllKnownPlatforms(config);
    const candidates = getCandidateSpecifiers("./styles.module.css", config.suffixes, known);

    expect(candidates).toEqual([
      { candidate: "./styles.module.macos.css", suffix: ".macos" },
      { candidate: "./styles.module.desktop.css", suffix: ".desktop" },
      { candidate: "./styles.module.native.css", suffix: ".native" },
      { candidate: "./styles.module.css", suffix: "" },
    ]);
  });

  it("throws explicit configuration error for unknown extended platform", () => {
    expect(() =>
      resolvePlatformChain("invalid", {
        invalid: { extends: ["unknownPlatform"] },
      })
    ).toThrowError(/Platform "invalid" extends unknown platform "unknownPlatform"/);
  });

  it("identifies eligible specifiers based on prefixes", () => {
    const prefixes = [".", "/", "@", "~"];
    
    // Eligible
    expect(isEligibleSpecifier("./Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("/src/Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("@/components/Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("~/utils", prefixes)).toBe(true);

    // Ineligible
    expect(isEligibleSpecifier("react", prefixes)).toBe(false);
    expect(isEligibleSpecifier("https://cdn.example.com/lib.js", prefixes)).toBe(false);
    expect(isEligibleSpecifier("\0vite/plugin", prefixes)).toBe(false);
  });

  it("appends explicit fallbacks to the suffix chain", () => {
    const config = createResolvedConfig({
      preset: "tauri",
      targetPlatform: "macos",
      fallbacks: ["web", "legacy"]
    });
    
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ".web", ".legacy", ""]);
  });

  it("passes through prefixes configuration", () => {
    const config = createResolvedConfig({
      targetPlatform: "macos",
      prefixes: ["#"]
    });
    
    expect(config.prefixes).toEqual(["#"]);
  });
});
