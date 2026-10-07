import { captureScreenshot } from "../support/capture-screenshot";
import { test, expect } from "@playwright/test";
import { openPage } from "../browser/support/page-boundary";
const specimens = [
  ["sign-in", "sign-in--signed-out", "Sign in to your workspace"],
  ["overview", "overview--ready", "U.S. Nuclear Outage Overview"],
  ["explorer", "explorer--ready", "Dataset Explorer"],
  ["query", "query--ready", "SQL Workspace"],
] as const;
test("four final page compositions preserve reference widths and inclusive breakpoint controls", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", (error) => { errors.push(error.message); });
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390, 479, 480, 481, 759, 760, 761, 999, 1000, 1001]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const [name, story, heading] of specimens) {
      await openPage(page, story);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await page.evaluate(async () => { await document.fonts.ready; });
      if (name !== "sign-in") {
        if (width <= 1000) await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeVisible();
        else await expect(page.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
      }
      if (name === "overview") await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
      if (name === "explorer") await expect(page.getByRole("tab", { name: "Preview", exact: true })).toBeVisible();
      if (name === "query") await expect(page.getByRole("textbox", { name: "SQL statement" })).toBeVisible();
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflows, `${name} outer document overflow at ${String(width)}`).toBe(false);
      if (width === 1440 || width === 390) {
        await page.getByTestId("fixture-controls").evaluate((element) => { element.setAttribute("hidden", ""); });
        await captureScreenshot(page, testInfo, `phase-6/${name}-${String(width)}.png`, { fullPage: true });
        if (name === "explorer") {
          await page.getByRole("tab", { name: "Schema", exact: true }).click();
          await expect(page.getByRole("table", { name: "Authorized dataset schema" })).toBeVisible();
          await captureScreenshot(page, testInfo, `phase-6/explorer-schema-${String(width)}.png`, { fullPage: true });
        }
        if (name === "query") {
          await page.getByRole("textbox", { name: "SQL statement" }).fill("SELECT * FROM synthetic_national");
          await page.getByRole("button", { name: "Run query", exact: true }).click();
          await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
          await captureScreenshot(page, testInfo, `phase-6/query-results-${String(width)}.png`, { fullPage: true });
        }
        if (name === "overview" && width === 390) {
          await page.getByRole("button", { name: "Open navigation", exact: true }).click();
          await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeVisible();
          await captureScreenshot(page, testInfo, "phase-6/navigation-390.png", { fullPage: true });
        }
      }
    }
  }
  expect(errors).toEqual([]);
});
