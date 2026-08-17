# Platformize

**Platformize** is a platform-aware module resolution system for the JavaScript/TypeScript ecosystem.

It brings the developer experience of React Native's platform-specific files to general-purpose JavaScript applications (Vite, Tauri, Electron, etc.):

```
src/components/
  Button.tsx
  Button.macos.tsx
  Button.windows.tsx
  Button.linux.tsx
```

Developers import modules normally:

```tsx
import Button from "./components/Button";
```

Platformize automatically resolves the appropriate implementation at build/module-resolution time based on the target platform and inheritance graph.

---

## Workspace Packages

| Package | Description |
|---|---|
| [`@platformize/core`](./packages/core) | Core resolution engine, platform graph definition, presets, and fallback chain algorithm. |
| [`@platformize/vite`](./packages/vite) | Vite plugin for platform-aware module resolution (supports Tauri, Electron, etc.). |
| [`@platformize/typescript`](./packages/typescript) | TypeScript integration utilities generating `moduleSuffixes` for standard TS typechecking. |
| [`@platformize/cli`](./packages/cli) | CLI diagnostic and configuration tools (`init`, `check`, `resolve`). |

---

## Quick Start

### 1. Install Vite Plugin & CLI

```bash
npm install -D @platformize/vite @platformize/cli @platformize/typescript
```

### 2. Configure Vite (`vite.config.ts`)

```typescript
import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      preset: "tauri",
    }),
  ],
});
```

### 3. Initialize TypeScript Configuration

```bash
npx platformize init --preset tauri --platform macos
```

This updates your `tsconfig.json` to include:

```json
{
  "compilerOptions": {
    "moduleSuffixes": [
      ".macos",
      ".desktop",
      ".native",
      ""
    ]
  }
}
```

---

## Tauri Preset Fallback Chain

When building for `macos` with the `tauri` preset:

```
Component.macos.tsx      ← 1 (Target platform)
Component.desktop.tsx    ← 2 (Shared desktop platform)
Component.native.tsx     ← 3 (Native base platform)
Component.tsx            ← 4 (Base fallback)
```

---

## Monorepo Development

### Build All Packages
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Example Project
See [`examples/tauri`](./examples/tauri) for a complete working Vite/Tauri example application.

---

## License

MIT
