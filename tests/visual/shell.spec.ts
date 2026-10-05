import { expect, test } from "@playwright/test";

test("native mobile drawer traps focus, excludes background, restores and closes deliberately", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto("/iframe.html?id=organisms-shell--ready&viewMode=story");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Application navigation" });
  await expect(drawer).toBeVisible();
  expect(await drawer.evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(drawer).toHaveCSS("width", "232px");
  const close = page.getByRole("button", { name: "Close navigation" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  const background = page.locator("main button");
  await background.evaluate((element) => { element.focus(); });
  await expect(close).toBeFocused();
  await page.mouse.click(370, 120);
  await expect(drawer).not.toBeVisible();
  await expect(page.getByText("Background count: 0")).toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("link", { name: "Dataset Explorer" }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page).toHaveURL(/#datasets$/);
  await trigger.click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByText("Sign-out count: 1")).toBeVisible();
});

test("drawer resize focuses active second destination and does not reopen on return", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1100 });
  await page.goto("/iframe.html?id=organisms-shell--ready&viewMode=story");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Application navigation" });
  await expect(drawer).toBeVisible();
  await page.setViewportSize({ width: 1001, height: 1100 });
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Dataset Explorer" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Open navigation" })).not.toBeVisible();
  await page.setViewportSize({ width: 999, height: 1100 });
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expect(drawer).not.toBeVisible();
});

test("pending shell withholds protected metadata; long title retains accessible text and accessory", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto("/iframe.html?id=organisms-shell--pending&viewMode=story");
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByText("Synthetic User")).toHaveCount(0);
  await expect(page.getByText("September 30, 2026")).toHaveCount(0);
  await page.goto("/iframe.html?id=organisms-shell--long-title&viewMode=story");
  const title = page.getByText("SyntheticUnbrokenHeaderTitleWithAllContentPreservedForAssistiveTechnology", { exact: true });
  await expect(title).toBeVisible();
  await expect(title).toHaveAttribute("title", "SyntheticUnbrokenHeaderTitleWithAllContentPreservedForAssistiveTechnology");
  await expect(page.getByText("Sample data", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("header")).toHaveCSS("height", "50px");
});
