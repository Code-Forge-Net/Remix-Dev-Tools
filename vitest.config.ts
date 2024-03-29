import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/docs/**", "**/public/**", "**/cjs-app/**", "**/esm-app/**", "**/test-apps/**"],
  },
});
