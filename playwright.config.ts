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
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A production build against a throwaway, seeded MongoDB (see scripts/e2e-server.ts).
    command: "pnpm build && pnpm -s e2e:server",
    url: `${baseURL}/projects`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
