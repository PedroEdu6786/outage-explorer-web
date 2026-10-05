import { test, expect } from "@playwright/test";
import { calls, openPage } from "./support/page-boundary";
test("sign-in page delegates managed login, then resolves the session deliberately", async ({ page }) => {
  await openPage(page, "sign-in--signed-out");
  await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to sign in", exact: true }).click();
  await expect(page.getByText("Complete managed sign-in", { exact: true })).toBeVisible();
  expect((await calls(page)).filter((call) => call.operation === "beginLogin")).toHaveLength(1);
  await page.getByRole("button", { name: "Check session", exact: true }).click();
  await expect(page.getByTestId("route-path")).toHaveText("/overview");
  await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
});
test("expired, pending and failure page states withhold protected content", async ({ page }) => {
  for (const [story, text] of [["expired", "Session expired"], ["pending", "Checking session"], ["failure", "Sign-in unavailable"]] as const) {
    await openPage(page, `sign-in--${story}`);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
  }
});
