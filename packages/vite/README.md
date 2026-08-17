# @platformize/vite

Vite plugin for Platformize platform-aware module resolution.

## Installation

```bash
npm install -D @platformize/vite
```

## Usage

In your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      preset: "tauri" // Platform auto-detected from environment variables!
    }),
  ],
});
```

### Zero-Config DX

Platformize is designed to be highly magical out of the box:

- **Auto Target Platform Detection**: You don't need to specify `targetPlatform`. It will automatically check `process.env.VITE_PLATFORM`, `process.env.TAURI_ENV_PLATFORM`, or fallback to `process.platform`.
- **Auto TypeScript Sync**: When Vite starts, Platformize will check your `tsconfig.json` and automatically update the `moduleSuffixes` to perfectly match the current active platform. Your IDE updates instantly. (Disable with `autoSyncTsConfig: false`).
- **Startup Logs**: Pass `verbose: true` to have Platformize print the exactly resolved fallback chain to your console on Vite startup.

### Custom Platforms & Fallbacks

You can define custom platforms, inheritance chains, node-level fallbacks, and custom file suffixes using string shorthands or full `PlatformNode` objects:

```typescript
import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      targetPlatform: "ios",
      platforms: {
        // String shorthand for simple inheritance (extends "mobile")
        ios: "mobile",
        android: "mobile",

        // Multiple inheritance shorthand
        mobile: ["native"],

        // Full PlatformNode object with custom suffixes and fallbacks
        web: {
          suffixes: [".web", ".browser"],
          fallbacks: ["common"]
        }
      },
      // Global safety-net fallbacks appended to all resolution chains
      fallbacks: "web"
    }),
  ],
});
```

### Dynamic Rules

You can add dynamic rules to override the target platform based on file paths (importer or source) or patterns:

```typescript
export default defineConfig({
  plugins: [
    platformize({
      preset: "tauri",
      targetPlatform: "macos", // Default
      rules: [
        {
          include: "/src/admin/",
          platform: "windows"
        }
      ]
    }),
  ],
});
```

## How It Works

1. Intercepts Vite module resolution (`resolveId`).
2. Generates candidate specifiers according to target platform inheritance rules, per-node fallbacks, and custom suffixes.
3. Invokes Vite's internal resolver with `{ skipSelf: true }` for each candidate until a matching file on disk is found.
4. Falls back to base module standard resolution if no platform variant exists.
