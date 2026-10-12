import { defineConfig, devices } from "@playwright/test";

// A dedicated port so e2e runs never collide with a dev server on 3000.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  // The dev server compiles each route on its first request.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Signs in through the emulator once per role and saves the sessions.
    // One at a time: concurrent emulator popups can lose their result.
    { name: "setup", testMatch: /auth\.setup\.ts/, fullyParallel: false },
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
  ],
  webServer: {
    // Seeded throwaway MongoDB, Firebase Auth Emulator, dev server (see scripts/e2e-server.ts).
    command: "pnpm -s e2e:server",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
