# @platformize/typescript

TypeScript integration utilities for Platformize.

## Installation

```bash
npm install -D @platformize/typescript
```

## Features

- Generates TypeScript `compilerOptions.moduleSuffixes` matching Platformize resolution rules.
- Utility to update `tsconfig.json` programmatically or via CLI.

## Usage

```typescript
import { getModuleSuffixes, generateTsConfigPatch, updateTsConfigFile } from "@platformize/typescript";

// Get moduleSuffixes array for target platform
const suffixes = getModuleSuffixes({ preset: "tauri", platform: "macos" });
// [".macos", ".desktop", ".native", ""]

// Programmatically update tsconfig.json
updateTsConfigFile("./tsconfig.json", { preset: "tauri", platform: "macos" });
```
