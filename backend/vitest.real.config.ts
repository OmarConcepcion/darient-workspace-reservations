import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/integration/**/*.test.ts"],
    setupFiles: ["src/test/setup.real.ts"],
    testTimeout: 45_000
  }
});
