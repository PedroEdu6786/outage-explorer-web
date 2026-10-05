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
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  await page.getByRole("button", { name: "Explore dataset", exact: true }).click();
  await expect(page.getByTestId("route-path")).toHaveText("/datasets");
  await expect(page.getByLabel("End date", { exact: true })).toHaveValue("2026-09-03");
  expect((await calls(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(0);
});
