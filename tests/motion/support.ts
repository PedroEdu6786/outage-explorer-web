import { expect, type Locator, type Page } from "@playwright/test";

export type MotionPreference = "reduce" | "no-preference";

/** Open a story with the `motion` global on, under an emulated reduced-motion preference. */
export async function openMotionStory(page: Page, id: string, preference: MotionPreference = "no-preference") {
  await page.emulateMedia({ reducedMotion: preference });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=motion:on`);
  // Feature stories also render their own "Synthetic fixture demo" note; the preview note is always first.
  await expect(page.getByRole("note").first()).toHaveText("Synthetic fixture preview — not live EIA data.");
  await expect(page.locator("#storybook-root")).not.toBeEmpty();
  // Prove the test-only motion-off stylesheet is absent (otherwise nothing here is meaningful).
  await expect(page.locator("style[data-motion-off]")).toHaveCount(0);
  await page.evaluate(async () => { await document.fonts.ready; });
}

/** Switch the emulated preference in place (computed values re-resolve without reload). */
export async function setPreference(page: Page, preference: MotionPreference) {
  await page.emulateMedia({ reducedMotion: preference });
}

export interface ComputedMotion {
  translate: string;
  scale: string;
  animationName: string;
  animationDuration: string;
  transitionDuration: string;
  transitionProperty: string;
  opacity: string;
}

/** Read computed motion properties. Callers assert with retrying matchers, never timing. */
export function readMotion(locator: Locator, pseudo?: string): Promise<ComputedMotion> {
  return locator.evaluate((element, pseudoElement) => {
    const style = getComputedStyle(element, pseudoElement);
    return {
      translate: style.translate,
      scale: style.scale,
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
      transitionProperty: style.transitionProperty,
      opacity: style.opacity,
    };
  }, pseudo);
}

/**
 * Resolve a root custom property to a number. Times become seconds and lengths
 * px, so minified `.12s`, `120ms` and `0s`/`0ms` spellings compare equal.
 */
export function rootToken(page: Page, name: string): Promise<number> {
  return page.evaluate((token) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const number = Number.parseFloat(value);
    if (value.endsWith("ms")) return number / 1000;
    return number;
  }, name);
}

export interface Movement { x: number; y: number; scale: number }

/** Computed translate (px) and scale as numbers; `none` is identity so reduce and idle compare equal. */
export function movement(locator: Locator): Promise<Movement> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const [x = "0", y = "0"] = style.translate === "none" ? [] : style.translate.split(" ");
    const scale = style.scale === "none" ? "1" : (style.scale.split(" ")[0] ?? "1");
    return { x: Number.parseFloat(x), y: Number.parseFloat(y), scale: Number.parseFloat(scale) };
  });
}

/** First transition duration in seconds (`0.12s` -> 0.12). */
export function seconds(value: string): number {
  return Number.parseFloat(value.split(",")[0] ?? "0");
}
