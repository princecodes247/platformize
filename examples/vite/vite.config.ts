import { defineConfig } from "vite";
import platformize from "@platformize/vite";

export default defineConfig({
  plugins: [
    platformize({
      preset: "tauri",
      verbose: true,
    }),
  ],
});
