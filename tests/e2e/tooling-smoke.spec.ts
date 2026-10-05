import { expect, test } from "@playwright/test";

test("built isolated Storybook executes keyboard interaction", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=tooling-smoke--interactive&viewMode=story");
  await expect(page.getByRole("note")).toHaveText("Synthetic fixture preview — not live EIA data.");
  const increment = page.getByRole("button", { name: "Increment smoke count" });
  await increment.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Smoke count: 1");
  expect(errors).toEqual([]);
});
