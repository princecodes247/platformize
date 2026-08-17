import { test, expect } from "vitest";
import { createResolvedConfig, evaluateRules } from "../packages/core/src/index.js";

test("evaluateRules returns default suffixes if no rules", () => {
  const config = createResolvedConfig({ platform: "macos", preset: "tauri" });
  const suffixes = evaluateRules("./App", "./main.tsx", config);
  expect(suffixes).toEqual([".macos", ".desktop", ".native", ""]);
});

test("evaluateRules matches regex test and returns getChain", () => {
  const config = createResolvedConfig({
    platform: "macos",
    preset: "tauri",
    rules: [
      {
        test: (source) => source.endsWith(".xyz"),
        getChain: () => ["custom", "base"],
      },
    ],
  });
  const suffixes = evaluateRules("./App.xyz", "./main.tsx", config);
  expect(suffixes).toEqual([".custom", ".base", ""]);
});

test("evaluateRules matches include path and applies platform", () => {
  const config = createResolvedConfig({
    platform: "macos",
    preset: "tauri",
    rules: [
      {
        include: /admin/,
        platform: "windows",
      },
    ],
  });
  const suffixes = evaluateRules("./components/Button", "/src/admin/Dashboard.tsx", config);
  expect(suffixes).toEqual([".windows", ".desktop", ".native", ""]);
});

test("evaluateRules ignores if excluded", () => {
  const config = createResolvedConfig({
    platform: "macos",
    preset: "tauri",
    rules: [
      {
        include: /admin/,
        exclude: /Button/,
        platform: "windows",
      },
    ],
  });
  // Excluded because source has Button
  const suffixes = evaluateRules("./components/Button", "/src/admin/Dashboard.tsx", config);
  expect(suffixes).toEqual([".macos", ".desktop", ".native", ""]);
});
