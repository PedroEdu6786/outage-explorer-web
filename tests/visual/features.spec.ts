import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator('[data-fixture-root="synthetic-only"]')).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
}
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 1100 }); await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z")); });
const specimens = [
  ["auth", "features-auth--managed-login-entry", "Sign in to your workspace"],
  ["overview", "features-overview--ready", "U.S. Nuclear Outage Overview"],
  ["explorer", "features-explorer--viewer", "Dataset Explorer"],
  ["queries", "features-queries--ready", "SQL Workspace"],
] as const;

test("four isolated features capture desktop/narrow and retain controls across source breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir("docs/specs/web-client/evidence/phase-4", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(error.message); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390, 479, 480, 481, 759, 760, 761, 999, 1000, 1001]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const [name, id, heading] of specimens) {
      await story(page, id);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      if (name === "overview") await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
      if (name === "explorer") await expect(page.getByRole("tab", { name: "Preview", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.fonts.check('650 25px "Inter"'))).toBe(true);
      if (width === 1440 || width === 390) await page.screenshot({ path: `docs/specs/web-client/evidence/phase-4/${name}-${String(width)}.png`, animations: "disabled" });
    }
  }
  expect(errors).toEqual([]);
});

test("Overview exact inspection, comparison and missing gaps work in Chromium", async ({ page }) => {
  await story(page, "features-overview--ready");
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  const compare = page.getByRole("checkbox", { name: "Compare EIA reported %" });
  await compare.focus(); await page.keyboard.press("Space"); await expect(compare).toBeChecked();
  await page.getByLabel("Inspect observation").selectOption("2026-09-01");
  await expect(page.getByText("Calculated offline: 1.01%", { exact: true })).toBeVisible();
  await expect(page.getByText("EIA reported: 1.01%", { exact: true })).toBeVisible();
  await expect(page.locator('[data-series="calculated"] [data-segment="observed"]')).toHaveCount(2);
  await page.getByLabel("Inspect observation").selectOption("2026-09-03");
  await expect(page.getByText("Calculated offline: 0.00%", { exact: true })).toBeVisible();
  await page.getByLabel("Inspect observation").selectOption("2026-09-02");
  await expect(page.getByText("Calculated offline: Unavailable", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1100 });
  const chart = page.getByRole("region", { name: "National trend: scrollable chart", exact: true });
  expect(await chart.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await chart.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(async () => chart.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.getByLabel("End date", { exact: true }).fill("2026-09-01");
  await page.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(page.getByText(/EIA reported: 1.01%/)).toBeVisible();
  await page.screenshot({ path: "docs/specs/web-client/evidence/phase-4/overview-exact-390.png", fullPage: true, animations: "disabled" });
});

test("Auth managed entry contains no credentials or persona controls", async ({ page }) => {
  await story(page, "features-auth--managed-login-entry");
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to sign in" }).click();
  await expect(page.getByText("Complete managed sign-in", { exact: true })).toBeVisible();
});

test("Explorer Viewer cursor continuation and keyboard schema tab retain permitted metadata", async ({ page }) => {
  await story(page, "features-explorer--viewer");
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await expect(page.getByText("Synthetic facility observations", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Facility", { exact: true })).toHaveCount(0);
  const next = page.getByRole("button", { name: "Next", exact: true });
  await next.click();
  await expect(page.getByRole("cell", { name: "2026-09-03", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("cell", { name: "2026-09-01", exact: true })).toBeVisible();
  const preview = page.getByRole("tab", { name: "Preview", exact: true });
  await preview.focus(); await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Schema", exact: true })).toBeFocused();
  await expect(page.getByRole("table", { name: "Authorized dataset schema" })).toBeVisible();
  await page.screenshot({ path: "docs/specs/web-client/evidence/phase-4/explorer-schema-1440.png", animations: "disabled" });
  await page.getByRole("button", { name: "Invalidate synthetic session" }).click();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("SQL single keyboard Run, edited draft, numbered retained pages and positional strings work in Chromium", async ({ page }) => {
  await story(page, "features-queries--ready");
  const editor = page.getByRole("textbox", { name: "SQL statement", exact: true });
  await editor.fill("SELECT * FROM synthetic_national");
  await editor.press("Control+Enter");
  await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "value", exact: true })).toHaveCount(2);
  await expect(page.getByRole("cell", { name: "9007199254740993", exact: true })).toHaveCount(2);
  await editor.fill("SELECT 'edited unsent text'");
  await expect(page.getByText("Results belong to the last submitted statement", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "<script>synthetic text only</script>", exact: true })).toBeVisible();
  await expect(editor).toHaveValue("SELECT 'edited unsent text'");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByText("Page 1 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
});

test("required state specimens capture synthetic expiry, denial, unavailable, truncation and uncertainty", async ({ page }) => {
  await mkdir("docs/specs/web-client/evidence/phase-4", { recursive: true });
  const states = [
    ["auth-expired", "features-auth--expired", "Session expired"],
    ["overview-denied", "features-overview--denied", "National data access denied"],
    ["overview-unavailable", "features-overview--unavailable", "Synthetic fixture: data-unavailable."],
    ["explorer-expired", "features-explorer--expired", "Preview expired"],
    ["queries-truncated", "features-queries--short-truncated-page", "Whole execution truncated"],
    ["queries-unknown", "features-queries--unknown-outcome", "Execution outcome unknown"],
  ] as const;
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (const [name, id, title] of states) {
    await story(page, id);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    if (name === "queries-truncated") await expect(page.getByText("Page 2 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
    await page.screenshot({ path: `docs/specs/web-client/evidence/phase-4/${name}-1440.png`, animations: "disabled" });
  }
});
