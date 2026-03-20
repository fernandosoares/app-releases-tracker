import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["src/main/**", "src/renderer/**"],
      exclude: ["src/main/index.ts", "src/main/ipc/**"],
    },
  },
  resolve: {
    alias: {
      "@main": resolve("src/main"),
      "@renderer": resolve("src/renderer"),
    },
  },
});
