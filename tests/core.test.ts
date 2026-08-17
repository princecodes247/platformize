import { describe, it, expect } from "vitest";
import {
  createResolvedConfig,
  getCandidateSpecifiers,
  getAllKnownPlatforms,
  hasExplicitPlatformSuffix,
  resolvePlatformChain,
  TAURI_PRESET,
} from "../packages/core/src/index.js";

describe("@platformize/core", () => {
  it("resolves inheritance chain for Tauri preset macos target", () => {
    const chain = resolvePlatformChain("macos", TAURI_PRESET);
    expect(chain).toEqual(["macos", "desktop", "native"]);
  });

  it("generates suffixes in expected order for macos", () => {
    const config = createResolvedConfig({ preset: "tauri", platform: "macos" });
    expect(config.suffixes).toEqual([".macos", ".desktop", ".native", ""]);
  });

  it("generates candidate specifiers without explicit suffix", () => {
    const config = createResolvedConfig({ preset: "tauri", platform: "macos" });
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
    const config = createResolvedConfig({ preset: "tauri", platform: "windows" });
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
    const config = createResolvedConfig({ preset: "tauri", platform: "macos" });
    const known = getAllKnownPlatforms(config);

    expect(hasExplicitPlatformSuffix("./Button.windows", known)).toBe(true);
    expect(hasExplicitPlatformSuffix("./Button.windows.tsx", known)).toBe(true);
    expect(hasExplicitPlatformSuffix("./Button", known)).toBe(false);

    const candidates = getCandidateSpecifiers("./Button.windows.tsx", config.suffixes, known);
    expect(candidates).toEqual([{ candidate: "./Button.windows.tsx", suffix: "" }]);
  });

  it("throws explicit configuration error for unknown extended platform", () => {
    expect(() =>
      resolvePlatformChain("invalid", {
        invalid: { extends: ["unknownPlatform"] },
      })
    ).toThrowError(/Platform "invalid" extends unknown platform "unknownPlatform"/);
  });
});
