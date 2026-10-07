import { test, expect } from "@playwright/test";
import { calls, openPage } from "./support/page-boundary";
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
