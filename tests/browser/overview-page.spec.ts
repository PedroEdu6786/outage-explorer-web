import { test, expect } from "@playwright/test";
import { calls, openPage } from "./support/page-boundary";

for (const width of [1440, 390]) {
  test(`long-range Overview zoom leaves page scope and operation calls unchanged at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openPage(page, "overview--long-range-zoom");
    const table = page.getByRole("table", { name: "Daily national observations" });
    await expect(table).toBeVisible();
    const caption = page.getByText(/^Visible dates:/);
    const full = await caption.innerText();
    const mode = page.getByRole("checkbox", { name: "Zoom mode" });
    await expect(mode).not.toBeChecked();
    await page.getByRole("combobox", { name: "Rows per page" }).selectOption("20");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const rows = await table.innerText();
    const cards = await page.locator("dl").allTextContents();
    const before = await calls(page);
    await mode.check(); await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect(caption).not.toHaveText(full);
    const zoomed = await caption.innerText();
    await page.getByRole("checkbox", { name: "Compare EIA reported %" }).check();
    await expect(caption).toHaveText(zoomed);
    await page.getByLabel("Start date", { exact: true }).fill("2026-02-01");
    await expect(caption).toHaveText(zoomed);
    await page.getByLabel("Start date", { exact: true }).fill("2026-01-01");
    await page.getByRole("form", { name: "Observation dates" }).evaluate((form: HTMLFormElement) => { form.requestSubmit(); });
    await expect(caption).toHaveText(zoomed);
    await page.getByRole("region", { name: "National trend: scrollable chart" }).focus();
    await page.keyboard.press("ArrowRight"); await expect(caption).not.toHaveText(zoomed);
    const moved = await caption.innerText(); await mode.uncheck(); await expect(caption).toHaveText(moved);
    await page.getByRole("button", { name: "Reset zoom" }).click(); await expect(caption).toHaveText(full);
    await expect(table).toHaveText(rows, { useInnerText: true }); expect(await page.locator("dl").allTextContents()).toEqual(cards);
    await expect(page.getByRole("combobox", { name: "Rows per page" })).toHaveValue("20");
    await expect(page.getByLabel("Start date", { exact: true })).toHaveValue("2026-01-01");
    await expect(page.getByLabel("End date", { exact: true })).toHaveValue("2026-12-31");
    expect(await calls(page)).toEqual(before);
    await mode.check(); await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByLabel("Start date", { exact: true }).fill("2026-02-01");
    await page.getByRole("button", { name: "Apply dates", exact: true }).click();
    await expect(table).toBeVisible(); await expect(caption).toHaveText("Visible dates: 2026-02-01 to 2026-12-31");
    await expect(mode).not.toBeChecked();
    expect((await calls(page)).filter((call) => call.operation === "readNationalSeries")).toHaveLength(2);
  });
}
test("Overview page preserves exact national values, date filtering and authorized handoff", async ({ page }) => {
  await openPage(page, "overview--ready");
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  await page.getByRole("combobox", { name: "Inspect observation" }).selectOption("2026-09-01");
  await expect(page.getByText("Calculated offline: 1.01%", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Compare EIA reported %" }).check();
  await expect(page.getByRole("checkbox", { name: "Compare EIA reported %" })).toBeChecked();
  await page.getByLabel("End date", { exact: true }).fill("2026-09-03");
  await page.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  await page.getByRole("button", { name: "Explore dataset", exact: true }).click();
  await expect(page.getByTestId("route-path")).toHaveText("/datasets");
  await expect(page.getByLabel("End date", { exact: true })).toHaveValue("2026-09-03");
  expect((await calls(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(0);
});

test("with motion on, withholding the session during a range change removes protected content at once and leaves no dim", async ({ page }) => {
  await openPage(page, "overview--ready", "motion:on");
  const table = page.getByRole("table", { name: "Daily national observations" });
  await expect(table).toBeVisible();
  const chart = page.locator("svg[data-chart=national-trend]");
  await expect(chart).toBeVisible();
  await expect(page.getByText("Fleet capacity offline", { exact: true })).toBeVisible();
  // Change the range, then withhold the session before the (synthetic, asynchronous) response is rendered.
  await page.getByLabel("End date", { exact: true }).fill("2026-09-03");
  await page.getByRole("button", { name: "Apply dates", exact: true }).click();
  await page.getByRole("button", { name: "Withhold unresolved session", exact: true }).click();
  // Protected content, the dimmed retained copy and its chart are gone without waiting for any animation.
  await expect(page.getByRole("heading", { name: "Restoring your session" })).toBeVisible({ timeout: 1000 });
  await expect(page.getByRole("navigation", { name: "Main navigation", includeHidden: true })).toHaveCount(0, { timeout: 1000 });
  await expect(chart).toHaveCount(0, { timeout: 1000 });
  await expect(page.getByText("Fleet capacity offline", { exact: true })).toHaveCount(0, { timeout: 1000 });
  await expect(page.getByText("Daily observations")).toHaveCount(0, { timeout: 1000 });
  await expect(page.getByLabel("End date", { exact: true })).toHaveCount(0, { timeout: 1000 });
  // No dimmed or inert remnant, and a late response cannot restore it: wait until the synthetic call settled.
  await expect.poll(async () => (await calls(page)).filter((call) => call.operation === "readNationalSeries").every((call) => call.outcome !== "pending"), { timeout: 5000 }).toBe(true);
  await expect(page.locator("[inert]")).toHaveCount(0);
  await expect(page.locator("[aria-hidden=true][class*='opacity-']")).toHaveCount(0);
  await expect(chart).toHaveCount(0);
  await expect(page.getByText("Fleet capacity offline", { exact: true })).toHaveCount(0);
});
