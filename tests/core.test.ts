import { describe, it, expect } from "vitest";
import {
  createResolvedConfig,
  getCandidateSpecifiers,
  getAllKnownPlatforms,
  hasExplicitPlatformSuffix,
  resolvePlatformChain,
  isEligibleSpecifier,
  TAURI_PRESET,
  normalizePlatformMap,
} from "../packages/core/src/index.js";

describe("@platformize/core", () => {
  it("resolves inheritance chain for Tauri preset macos target", () => {
    const normalized = normalizePlatformMap(TAURI_PRESET);
    const chain = resolvePlatformChain("macos", normalized);
    expect(chain).toEqual(["macos", "desktop", "native"]);
  });

  it("generates suffixes in expected order for macos", () => {
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "macos" });
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });

  it("supports string and string[] shorthands in platforms map", () => {
    const config = createResolvedConfig({
      targetPlatform: "ios",
      platforms: {
        ios: ["mobile", "native"],
        mobile: "native",
        native: [],
      },
    });

    expect(config.chain).toEqual(["ios", "mobile", "native"]);
    expect(config.suffixes).toEqual([".ios", ".mobile", ".native", ""]);
  });

  it("throws a helpful error when targetPlatform is unknown in strict mode", () => {
    expect(() =>
      createResolvedConfig({
        preset: "tauri",
        targetPlatform: "macoss",
      })
    ).toThrowError(/Target platform "macoss" is not defined in the configured platforms or preset/);
  });

  it("allows unknown targetPlatform when strict: false", () => {
    const config = createResolvedConfig({
      preset: "tauri",
      targetPlatform: "tvos",
      strict: false,
    });

    expect(config.chain).toEqual(["tvos"]);
    expect(config.suffixes).toEqual([".tvos", ""]);
  });

  it("resolves target platform aliases to canonical platform node", () => {
    // darwin is an alias for macos in Tauri preset
    const config = createResolvedConfig({ preset: "tauri", targetPlatform: "darwin" });
    expect(config.platform).toBe("macos");
    expect(config.chain).toEqual(["macos", "desktop", "native"]);
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });

  it("supports per-platform fallbacks", () => {
    const config = createResolvedConfig({
      targetPlatform: "macos",
      platforms: {
        macos: {
          extends: "desktop",
          fallbacks: "web",
        },
        desktop: "native",
        native: [],
        web: [],
      },
    });

    expect(config.chain).toEqual(["macos", "desktop", "native", "web"]);
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ".web", ""]);
  });

  it("supports custom suffixes per platform node", () => {
    const config = createResolvedConfig({
      targetPlatform: "web",
      platforms: {
        web: {
          suffixes: [".web", ".browser"],
        },
      },
    });

    expect(config.suffixes).toEqual([".web", ".browser", ""]);
    const known = getAllKnownPlatforms(config);
    expect(known.has("browser")).toBe(true);
    expect(known.has("web")).toBe(true);
  });

  it("appends global fallbacks at the end of resolution chain", () => {
    const config = createResolvedConfig({
      preset: "tauri",
      targetPlatform: "macos",
      fallbacks: ["web", "legacy"],
    });

    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ".web", ".legacy", ""]);
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
      resolvePlatformChain(
        "invalid",
        normalizePlatformMap({
          invalid: { extends: ["unknownPlatform"] },
        })
      )
    ).toThrowError(/Platform "invalid" extends unknown platform "unknownPlatform"/);
  });

  it("identifies eligible specifiers based on prefixes", () => {
    const prefixes = [".", "/", "@", "~"];

    expect(isEligibleSpecifier("./Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("/src/Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("@/components/Button", prefixes)).toBe(true);
    expect(isEligibleSpecifier("~/utils", prefixes)).toBe(true);

    expect(isEligibleSpecifier("react", prefixes)).toBe(false);
    expect(isEligibleSpecifier("https://cdn.example.com/lib.js", prefixes)).toBe(false);
    expect(isEligibleSpecifier("\0vite/plugin", prefixes)).toBe(false);
  });
});
