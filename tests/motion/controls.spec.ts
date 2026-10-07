import { expect, test, type Locator, type Page } from "@playwright/test";
import { movement, openMotionStory, readMotion, seconds, type MotionPreference } from "./support";

const preferences: readonly MotionPreference[] = ["no-preference", "reduce"];

for (const preference of preferences) {
  const reduce = preference === "reduce";

  test.describe(`controls with ${preference}`, () => {
    test("Button and IconButton press moves/scales only without a reduced-motion preference; color still changes", async ({ page }) => {
      await openMotionStory(page, "atoms-actions--motion-review", preference);
      const button = page.getByRole("button", { name: "Hover or press me" });
      await button.hover();
      // Hover color change remains under reduce (transition shortened, not removed).
      await expect(button).toHaveCSS("background-color", "rgb(5, 102, 106)");
      await page.mouse.down();
      await expect.poll(async () => (await movement(button)).y).toBe(reduce ? 0 : 1);
      await page.mouse.up();
      await expect.poll(async () => (await movement(button)).y).toBe(0);

      const icon = page.getByRole("button", { name: "Close preview" });
      await icon.hover();
      await page.mouse.down();
      await expect.poll(async () => (await movement(icon)).scale).toBe(reduce ? 1 : 0.96);
      await page.mouse.up();
      await expect.poll(async () => (await movement(icon)).scale).toBe(1);
      expect(seconds((await readMotion(icon)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);

      // Keyboard: Tab reaches the primary action; Space activates without relying on animation.
      await page.getByRole("button", { name: "Start loading" }).focus();
      await page.keyboard.press("Space");
      const loading = page.getByRole("button", { name: "Saving…" });
      await expect(loading).toBeDisabled();
      await expect(loading).toHaveAttribute("aria-busy", "true");
      await expect(page.locator("button[aria-busy=true] > span")).toHaveCSS("animation-name", "fade-in");
      expect(seconds((await readMotion(page.locator("button[aria-busy=true] > span"))).animationDuration)).toBeCloseTo(reduce ? 0.1 : 0.2, 5);
    });

    test("inputs ease their focus ring and nudge once on becoming invalid", async ({ page }) => {
      await openMotionStory(page, "atoms-controls--motion-review", preference);
      const field = page.locator("#motion-field");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(field).toBeFocused();
      await expect(field).toHaveCSS("outline-style", "solid");
      await expect(field).toHaveCSS("outline-color", "rgb(8, 125, 130)");
      expect(seconds((await readMotion(field)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      await page.getByRole("button", { name: "Mark invalid" }).click();
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveCSS("border-top-color", "rgb(173, 61, 61)");
      await expect(field).toHaveCSS("animation-name", reduce ? "none" : "nudge");
      await expect(page.getByText("Choose a start date.")).toBeVisible();
    });

    test("checkbox stays native, toggles with Space and draws its check without movement under reduce", async ({ page }) => {
      await openMotionStory(page, "atoms-controls--motion-review", preference);
      const box = page.getByRole("checkbox", { name: "Unchecked, toggle with Space" });
      await box.focus();
      await expect(box).not.toBeChecked();
      await expect.poll(() => readMotion(box, "::after").then((value) => value.transitionDuration)).toBe(reduce ? "0s" : "0.2s");
      await page.keyboard.press("Space");
      await expect(box).toBeChecked();
      await expect(box).toHaveCSS("background-color", "rgb(8, 125, 130)");
      await expect.poll(() => box.evaluate((element) => getComputedStyle(element, "::after").clipPath)).toBe("inset(0px)");
      await page.keyboard.press("Space");
      await expect(box).not.toBeChecked();
      await expect.poll(() => box.evaluate((element) => getComputedStyle(element, "::after").clipPath)).toBe("inset(0px 100% 0px 0px)");
    });

    test("badge tone changes cross-fade color", async ({ page }) => {
      await openMotionStory(page, "atoms-status-and-surfaces--tone-switch-review", preference);
      const badge = page.getByText("Tone: neutral");
      await expect(badge).toHaveCSS("color", "rgb(87, 105, 115)");
      expect(seconds((await readMotion(badge)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      await page.getByRole("button", { name: "Next tone" }).click();
      await expect(page.getByText("Tone: info")).toHaveCSS("color", "rgb(36, 107, 158)");
    });

    test("tabs select by keyboard and slide an indicator that jumps under reduce", async ({ page }) => {
      await openMotionStory(page, "molecules-navigation--multiple-tabs", preference);
      const tablist = page.getByRole("tablist");
      await expect(tablist).toHaveAttribute("data-indicator", "ready");
      const indicator = page.locator("[data-sliding-indicator]");
      expect(await indicator.evaluate((element) => getComputedStyle(element).height)).toBe("2px");
      const before = await tablist.evaluate((element) => element.style.getPropertyValue("--indicator-x"));
      await page.getByRole("tab", { name: "Preview" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("tab", { name: "Schema" })).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tab", { name: "Schema" })).toBeFocused();
      await expect.poll(() => tablist.evaluate((element) => element.style.getPropertyValue("--indicator-x"))).not.toBe(before);
      await expect(indicator).toHaveCSS("transition-duration", reduce ? "0s" : "0.2s");
      await page.keyboard.press("End");
      await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: "Notes" })).toHaveCSS("animation-name", "fade-rise");
      await expect(page.locator("[role=tabpanel][hidden]")).toHaveCount(3);
      // Final underline sits under the selected tab.
      await expect.poll(() => indicatorUnderTab(page, "Notes")).toBe(true);
    });

    test("desktop navigation indicator slides between destinations; hover nudge only without reduce", async ({ page }) => {
      await openMotionStory(page, "organisms-shell--desktop-indicator", preference);
      const nav = page.locator("aside nav");
      await expect(nav).toHaveAttribute("data-indicator", "ready");
      const indicator = nav.locator("[data-sliding-indicator]");
      await expect(indicator).toHaveCSS("transition-duration", reduce ? "0s" : "0.2s");
      const before = await nav.evaluate((element) => element.style.getPropertyValue("--indicator-y"));
      await page.getByRole("button", { name: "Show SQL Workspace" }).click();
      await expect(nav.getByRole("link", { name: "SQL Workspace" })).toHaveAttribute("aria-current", "page");
      await expect.poll(() => nav.evaluate((element) => element.style.getPropertyValue("--indicator-y"))).not.toBe(before);
      await expect.poll(() => indicatorOverLink(nav, "SQL Workspace")).toBe(true);

      const inactive = nav.getByRole("link", { name: "Overview" });
      await inactive.hover();
      await expect.poll(async () => (await movement(inactive)).x).toBe(reduce ? 0 : 2);
      await expect(inactive).not.toHaveAttribute("aria-current");

      // Keyboard focus reaches destinations and stays visible.
      await nav.getByRole("link", { name: "Dataset Explorer" }).focus();
      await expect(nav.getByRole("link", { name: "Dataset Explorer" })).toBeFocused();
    });
  });
}

async function indicatorUnderTab(page: Page, name: string) {
  const tab = await page.getByRole("tab", { name }).boundingBox();
  const bar = await page.locator("[data-sliding-indicator]").boundingBox();
  if (!tab || !bar) return false;
  // The transition may still be running; callers poll until it settles.
  return Math.abs(bar.x - tab.x) < 1 && Math.abs(bar.width - tab.width) < 1;
}

async function indicatorOverLink(nav: Locator, name: string) {
  const link = await nav.getByRole("link", { name }).boundingBox();
  const bar = await nav.locator("[data-sliding-indicator]").boundingBox();
  if (!link || !bar) return false;
  return Math.abs(bar.y - link.y) < 1 && Math.abs(bar.height - link.height) < 1;
}
