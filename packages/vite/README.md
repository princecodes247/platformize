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
      preset: "tauri",
      platform: process.env.VITE_PLATFORM || "macos",
    }),
  ],
});
```

## How It Works

1. Intercepts Vite module resolution (`resolveId`).
2. Generates candidate specifiers according to target platform inheritance rules.
3. Invokes Vite's internal resolver with `{ skipSelf: true }` for each candidate until a matching file on disk is found.
4. Falls back to base module standard resolution if no platform variant exists.
