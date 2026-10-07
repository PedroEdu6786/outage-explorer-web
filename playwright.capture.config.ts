import { defineConfig, devices } from "@playwright/test";
import config from "./playwright.config";

/** Synthetic Storybook captures; review output before copying into saved evidence. */
export default defineConfig({
  ...config,
  testMatch: "visual/**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  outputDir: "./playwright-report/capture-results",
  projects: [{
    name: "capture-chromium",
    metadata: { captureScreenshots: true },
    use: { ...devices["Desktop Chrome"] },
  }],
});
