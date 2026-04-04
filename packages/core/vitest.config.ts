import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@repo/contracts/timer": path.resolve(
        __dirname,
        "../contracts/src/timer/index.ts"
      ),
    },
  },
  test: {
    environment: "node",
  },
});
