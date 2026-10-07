import { expect, test } from "@playwright/test";
import { openMotionStory, readMotion, rootToken, seconds, setPreference } from "./support";

const ACTIONS = "atoms-actions--motion-review";
const LOADING = "atoms-status-and-surfaces--loading";
const TABS = "molecules-navigation--multiple-tabs";

test("motion tokens resolve to the documented values and drive component durations", async ({ page }) => {
  await openMotionStory(page, ACTIONS, "no-preference");
  expect(await rootToken(page, "--duration-fast")).toBe(0.12);
  expect(await rootToken(page, "--duration-base")).toBe(0.2);
  expect(await rootToken(page, "--duration-enter")).toBe(0.26);
  expect(await rootToken(page, "--duration-move")).toBe(0.2);
  expect(await rootToken(page, "--motion-rise")).toBe(4);
  expect(await rootToken(page, "--motion-press-shift")).toBe(1);
  expect(await rootToken(page, "--motion-press-scale")).toBe(0.96);
  expect(await rootToken(page, "--motion-nudge")).toBe(2);

  // Control feedback uses the fast token; the loading label uses the base token.
  const button = page.getByRole("button", { name: "Hover or press me" });
  expect(seconds((await readMotion(button)).transitionDuration)).toBeCloseTo(0.12, 5);
  await page.getByRole("button", { name: "Start loading" }).click();
  const label = page.locator("button[aria-busy=true] > span");
  await expect(label).toHaveCount(1);
  const loadingLabel = await readMotion(label);
  expect(loadingLabel.animationName).toBe("fade-in");
  expect(seconds(loadingLabel.animationDuration)).toBeCloseTo(0.2, 5);

  await openMotionStory(page, TABS, "no-preference");
  const panel = await readMotion(page.getByRole("tabpanel", { name: "Preview" }));
  expect(panel.animationName).toBe("fade-rise");
  expect(seconds(panel.animationDuration)).toBeCloseTo(0.26, 5);
});

test("reduced motion collapses movement tokens and keeps shortened opacity/color transitions", async ({ page }) => {
  await openMotionStory(page, ACTIONS, "reduce");
  expect(await rootToken(page, "--motion-rise")).toBe(0);
  expect(await rootToken(page, "--motion-press-shift")).toBe(0);
  expect(await rootToken(page, "--motion-press-scale")).toBe(1);
  expect(await rootToken(page, "--motion-nudge")).toBe(0);
  expect(await rootToken(page, "--duration-move")).toBe(0);
  expect(await rootToken(page, "--stagger-step")).toBe(0);
  expect(await rootToken(page, "--duration-fast")).toBe(0.06);
  const button = await readMotion(page.getByRole("button", { name: "Hover or press me" }));
  expect(seconds(button.transitionDuration)).toBeCloseTo(0.06, 5);
  expect(button.transitionProperty).toContain("background-color");

  // Switching the emulated preference re-resolves the same page.
  await setPreference(page, "no-preference");
  expect(await rootToken(page, "--motion-press-scale")).toBe(0.96);
});

test("spinner rotation uses the token at 0.8s and stops under reduced motion", async ({ page }) => {
  await openMotionStory(page, LOADING, "no-preference");
  const ring = page.getByRole("status").locator("span[aria-hidden=true]");
  const rotating = await readMotion(ring);
  expect(rotating.animationName).toBe("spinner");
  expect(rotating.animationDuration).toBe("0.8s");
  await setPreference(page, "reduce");
  await expect(ring).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("status")).toHaveText("Loading preview");
});

test("exactly one reduced-motion rule is emitted and it is unlayered", async ({ page }) => {
  await openMotionStory(page, ACTIONS, "no-preference");
  const report = await page.evaluate(() => {
    const blocks: { layered: boolean; text: string }[] = [];
    function visit(rules: CSSRuleList, layered: boolean) {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion")) blocks.push({ layered, text: rule.cssText });
        else if (rule instanceof CSSLayerBlockRule) visit(rule.cssRules, true);
        else if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules, layered);
      }
    }
    for (const sheet of Array.from(document.styleSheets)) {
      try { visit(sheet.cssRules, false); } catch { /* cross-origin sheets are not application CSS */ }
    }
    return blocks;
  });
  expect(report).toHaveLength(1);
  expect(report[0]?.layered).toBe(false);
  expect(report[0]?.text).toContain("--animate-spinner: none");
});
