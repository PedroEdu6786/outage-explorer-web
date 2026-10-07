import { defineConfig, devices } from "@playwright/test";
/** Fresh production build, separate port; no story/test adapter interception. */
export default defineConfig({
  outputDir: "./playwright-report/production-results",
  testDir: "./tests/browser", testMatch: "production-failure.spec.ts", forbidOnly: Boolean(process.env.CI), retries: 0, reporter: "list",
  use: { baseURL: "http://127.0.0.1:6008", reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [{ name: "production-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run start -- --hostname 127.0.0.1 --port 6008", url: "http://127.0.0.1:6008/sign-in", reuseExistingServer: false },
});
