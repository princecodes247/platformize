# @platformize/cli

Command line interface for Platformize configuration, resolution diagnostics, and file inspection built with [`commandstruct`](https://www.npmjs.com/package/commandstruct).

## Installation

```bash
npm install -D @platformize/cli
```

## Commands

### `platformize init`
Initializes Platformize configuration by updating `tsconfig.json` `moduleSuffixes` and logging recommended `vite.config.ts` options.

```bash
npx platformize init --preset tauri --platform macos
```

### `platformize check`
Scans source files in a directory and reports which platform-specific file variant resolves for each base module.

```bash
npx platformize check --dir ./src --platform macos --preset tauri
```

Output:
```
Platformize

Platform: macos
Fallback chain: macos -> desktop -> native -> base

✓ ./src/components/WindowControls.macos.tsx
⚠ ./src/App.tsx not specialized for macos
  Using ./src/App.tsx
```

### `platformize resolve`
Resolves a specific module specifier for a target platform.

```bash
npx platformize resolve ./src/components/WindowControls --platform windows
```

Output:
```
./src/components/WindowControls.windows.tsx
```
