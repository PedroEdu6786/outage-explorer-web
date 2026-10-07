import { defineConfig, devices } from "@playwright/test";

/** Run against `npm run dev` on localhost:3000 with auth enabled. */
export default defineConfig({
  testDir: "./tests/development",
  outputDir: "./playwright-report/development-results",
  forbidOnly: Boolean(process.env.CI), retries: 0, reporter: "list",
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:3000", reducedMotion: "reduce", trace: "off", video: "off", screenshot: "off" },
  projects: [{ name: "development-chromium", use: { ...devices["Desktop Chrome"] } }],
});
