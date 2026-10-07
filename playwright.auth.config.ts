import { defineConfig, devices } from "@playwright/test";

/** Real Flask, no interception/fixtures; sensitive auth headers must not enter traces. */
export default defineConfig({
  testDir: "./tests/live", testMatch: "auth-smoke.spec.ts", outputDir: "./playwright-report/auth-results",
  forbidOnly: Boolean(process.env.CI), retries: 0, reporter: "list",
  use: { baseURL: "http://localhost:3000", reducedMotion: "reduce", trace: "off", screenshot: "off", video: "off" },
  projects: [{ name: "auth-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run start -- --hostname localhost --port 3000", url: "http://localhost:3000/sign-in", reuseExistingServer: false },
});
