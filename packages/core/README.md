# @platformize/core

The resolution engine behind Platformize. It manages platform graphs, inheritance chains, preset definitions, and candidate suffix generation without depending on any specific bundler or build tool.

## Installation

```bash
npm install @platformize/core
```

## Features

- **Platform Inheritance Graphs**: Support platforms extending shared ancestor platforms (e.g. `macos` extends `desktop` which extends `native`).
- **Presets**: Built-in `tauri` preset for `macos`, `windows`, `linux`, `desktop`, `native`.
- **Candidate Generator**: Computes candidate paths preserving extensions and detecting explicit platform suffixes to prevent double suffixing (`Button.windows.macos.tsx`).

## Usage

```typescript
import { createResolvedConfig, getCandidateSpecifiers, getAllKnownPlatforms } from "@platformize/core";

const config = createResolvedConfig({
  preset: "tauri",
  platform: "macos"
});

console.log(config.suffixes);
// Output: [".macos", ".desktop", ".native", ""]

const known = getAllKnownPlatforms(config);
const candidates = getCandidateSpecifiers("./components/Button.tsx", config.suffixes, known);

console.log(candidates);
/*
[
  { candidate: "./components/Button.macos.tsx", suffix: ".macos" },
  { candidate: "./components/Button.desktop.tsx", suffix: ".desktop" },
  { candidate: "./components/Button.native.tsx", suffix: ".native" },
  { candidate: "./components/Button.tsx", suffix: "" }
]
*/
```

## Custom Platform Definition

```typescript
import { createResolvedConfig } from "@platformize/core";

const config = createResolvedConfig({
  platform: "ios",
  platforms: {
    ios: { extends: ["mobile", "native"] },
    android: { extends: ["mobile", "native"] },
    mobile: { extends: ["native"] },
    native: { extends: [] }
  }
});
```
