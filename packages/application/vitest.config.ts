import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@repo/timer-core": path.resolve(__dirname, "../timer-core/src/index.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
