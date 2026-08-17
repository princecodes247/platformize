import { describe, it, expect } from "vitest";
import platformize from "../packages/vite/src/index.js";

describe("@platformize/vite", () => {
  it("initializes plugin with correct name and enforce property", () => {
    const plugin = platformize({ preset: "tauri", targetPlatform: "macos" });
    expect(plugin.name).toBe("platformize");
    expect(plugin.enforce).toBe("pre");
  });

  it("attempts to resolve candidate paths using host resolver mock", async () => {
    const plugin = platformize({ preset: "tauri", targetPlatform: "macos" });
    const resolveFn = plugin.resolveId as (this: any, ...args: any[]) => Promise<any>;

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
    const plugin = platformize({ preset: "tauri", targetPlatform: "macos" });
    const resolveFn = plugin.resolveId as (this: any, ...args: any[]) => Promise<any>;

    const mockContext = {
      async resolve(candidate: string) {
        if (candidate === "./Button.tsx") {
          return { id: "/project/src/Button.tsx" };
        }
        return null;
      },
    };

    const resolved = await resolveFn.call(mockContext, "./Button.tsx", "/project/src/App.tsx", {});
    expect(resolved).toBeNull();
  });

  it("resolves candidate paths using custom defined platforms without a preset", async () => {
    const plugin = platformize({
      targetPlatform: "ios",
      platforms: {
        ios: ["mobile", "native"],
        android: ["mobile", "native"],
        mobile: "native",
        native: [],
      },
    });
    const resolveFn = plugin.resolveId as (this: any, ...args: any[]) => Promise<any>;

    const mockContext = {
      async resolve(candidate: string) {
        if (candidate === "./Button.mobile.tsx") {
          return { id: "/project/src/Button.mobile.tsx" };
        }
        return null;
      },
    };

    const resolved = await resolveFn.call(mockContext, "./Button.tsx", "/project/src/App.tsx", {});
    expect(resolved).toEqual({ id: "/project/src/Button.mobile.tsx" });
  });

  it("auto-detects platform from VITE_PLATFORM environment variable", async () => {
    process.env.VITE_PLATFORM = "linux";

    const plugin = platformize({ preset: "tauri" });
    const resolveFn = plugin.resolveId as (this: any, ...args: any[]) => Promise<any>;

    const mockContext = {
      async resolve(candidate: string) {
        if (candidate === "./Button.linux.tsx") {
          return { id: "/project/src/Button.linux.tsx" };
        }
        return null;
      },
    };

    const resolved = await resolveFn.call(mockContext, "./Button.tsx", "/project/src/App.tsx", {});
    expect(resolved).toEqual({ id: "/project/src/Button.linux.tsx" });

    delete process.env.VITE_PLATFORM;
  });
});
