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

- **Auto Platform Detection**: You don't need to specify `platform`. It will automatically check `process.env.VITE_PLATFORM`, `process.env.TAURI_ENV_PLATFORM`, or fallback to `process.platform`.
- **Auto TypeScript Sync**: When Vite starts, Platformize will check your `tsconfig.json` and automatically update the `moduleSuffixes` to perfectly match the current active platform. Your IDE updates instantly. (Disable with `autoSyncTsConfig: false`).
- **Startup Logs**: Pass `verbose: true` to have Platformize print the exactly resolved fallback chain to your console on Vite startup.

### Custom Platforms & Rules

You can completely define your own custom platforms and inheritance rules, overriding or extending the built-in presets:

```typescript
import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      targetPlatform: "ios", // current target platform
      platforms: {
        ios: { extends: ["mobile", "native"] },
        android: { extends: ["mobile", "native"] },
        mobile: { extends: ["native"] },
        native: { extends: [] }
      }
    }),
  ],
});
```

### Dynamic Rules

You can add dynamic rules to override the target platform based on file paths (importer or source) or patterns. 

For example, to force all imports inside the `src/admin` directory to resolve using `windows` fallbacks:

```typescript
export default defineConfig({
  plugins: [
    platformize({
      preset: "tauri",
      targetPlatform: "macos", // Default
      rules: [
        {
          include: "/src/admin/",
          targetPlatform: "windows"
        }
      ]
    }),
  ],
});
```

You can also use programmatic `test` and `getChain` hooks for maximum flexibility (note: TypeScript typechecking will not be aware of these dynamic programmatic overrides).

## How It Works

1. Intercepts Vite module resolution (`resolveId`).
2. Generates candidate specifiers according to target platform inheritance rules.
3. Invokes Vite's internal resolver with `{ skipSelf: true }` for each candidate until a matching file on disk is found.
4. Falls back to base module standard resolution if no platform variant exists.
