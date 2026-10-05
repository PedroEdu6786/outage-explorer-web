import { defineConfig, devices } from "@playwright/test";
/** Configured actual Next production composition, intercepted synthetic HTTP only. */
export default defineConfig({
  testDir: "./tests/development", testMatch: "data-production.spec.ts",
  outputDir: "./playwright-report/controlled-results",
  forbidOnly: Boolean(process.env.CI), retries: 0, reporter: "list",
  use: { baseURL: "http://127.0.0.1:6009", trace: "retain-on-failure" },
  projects: [{ name: "controlled-production-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run start -- --hostname 127.0.0.1 --port 6009", url: "http://127.0.0.1:6009/overview", reuseExistingServer: false },
});
