import { describe, it, expect } from "vitest";
import platformize from "../packages/vite/src/index.js";

describe("@platformize/vite", () => {
  it("initializes plugin with correct name and enforce property", () => {
    const plugin = platformize({ preset: "tauri", platform: "macos" });
    expect(plugin.name).toBe("platformize");
    expect(plugin.enforce).toBe("pre");
  });

  it("attempts to resolve candidate paths using host resolver mock", async () => {
    const plugin = platformize({ preset: "tauri", platform: "macos" });
    const resolveFn = plugin.resolveId as Function;

    const mockContext = {
      async resolve(candidate: string) {
        if (candidate === "./Button.macos.tsx") {
          return { id: "/project/src/Button.macos.tsx" };
        }
        return null;
      },
    };

    const resolved = await resolveFn.call(mockContext, "./Button.tsx", "/project/src/App.tsx");
    expect(resolved).toEqual({ id: "/project/src/Button.macos.tsx" });
  });

  it("falls back to base implementation if platform implementation does not exist", async () => {
    const plugin = platformize({ preset: "tauri", platform: "macos" });
    const resolveFn = plugin.resolveId as Function;

    const mockContext = {
      async resolve(candidate: string) {
        if (candidate === "./Button.tsx") {
          return { id: "/project/src/Button.tsx" };
        }
        return null;
      },
    };

    const resolved = await resolveFn.call(mockContext, "./Button.tsx", "/project/src/App.tsx");
    expect(resolved).toBeNull();
  });
});
