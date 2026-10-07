import { expect, test, type Page } from "@playwright/test";
import { openMotionStory, readMotion, rootToken, seconds, type MotionPreference } from "./support";

const preferences: readonly MotionPreference[] = ["no-preference", "reduce"];

/** Open a story with the `motion` global explicitly on or off (the default) and wait for fonts. */
async function openStory(page: Page, id: string, motion: "on" | "off") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=motion:${motion}`);
  await expect(page.getByRole("note").first()).toHaveText("Synthetic fixture preview — not live EIA data.");
  await page.evaluate(async () => { await document.fonts.ready; });
}

const drawerState = (page: Page) => page.locator("dialog").evaluate((dialog) => ({
  display: getComputedStyle(dialog).display,
  pointerEvents: getComputedStyle(dialog).pointerEvents,
  open: (dialog as HTMLDialogElement).open,
  transitions: dialog.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty),
}));

for (const preference of preferences) {
  const reduce = preference === "reduce";

  test.describe(`entrances and chart with ${preference}`, () => {
    test("drawer slides and fades its backdrop with CSS only; close() stays synchronous and the closed state is inert", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await openMotionStory(page, "organisms-shell--ready", preference);
      const dialog = page.getByRole("dialog", { name: "Application navigation", includeHidden: true });
      const trigger = page.getByRole("button", { name: "Open navigation" });
      expect(await rootToken(page, "--motion-drawer-shift")).toBe(reduce ? 0 : -100);

      // Closed: not rendered, and no transition lingers on the element.
      expect((await drawerState(page)).display).toBe("none");
      const styles = await readMotion(dialog);
      expect(styles.transitionProperty).toContain("translate");
      expect(styles.transitionProperty).toContain("overlay");
      expect(styles.transitionProperty).toContain("display");
      expect(seconds(styles.transitionDuration)).toBeCloseTo(reduce ? 0 : 0.2, 5);

      // Open: showModal() ran synchronously; a translate transition exists only without reduce.
      await trigger.click();
      const opening = await drawerState(page);
      expect(opening.open).toBe(true);
      expect(opening.transitions.includes("translate")).toBe(!reduce);
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
      await expect.poll(async () => dialog.evaluate((element) => getComputedStyle(element).translate)).toMatch(/^(?:none|0px(?: 0px)?)$/);
      expect(await page.evaluate(() => getComputedStyle(document.querySelector("dialog") as Element, "::backdrop").opacity)).toBe("1");

      // Header icon swaps (decorative) while label and aria-expanded stay.
      const headerButton = page.locator("header button");
      await expect(headerButton).toHaveAttribute("aria-label", "Open navigation");
      await expect(headerButton).toHaveAttribute("aria-expanded", "true");
      const icon = headerButton.locator("> span[aria-hidden=true]");
      await expect(icon).toHaveCSS("animation-name", "icon-swap");
      expect(await rootToken(page, "--motion-icon-rotate")).toBe(reduce ? 0 : -90);

      // Close: the element leaves [open] at once; it stays rendered (exit) only without reduce, and never takes pointer input.
      const closing = await page.getByRole("button", { name: "Close navigation" }).evaluate((button) => {
        (button as unknown as HTMLElement).click();
        return new Promise<{ open: boolean; display: string; pointerEvents: string }>((resolve) => {
          requestAnimationFrame(() => {
            const element = document.querySelector("dialog");
            if (!element) throw new Error("dialog required");
            resolve({ open: element.open, display: getComputedStyle(element).display, pointerEvents: getComputedStyle(element).pointerEvents });
          });
        });
      });
      expect(closing.open).toBe(false);
      expect(closing.pointerEvents).toBe("none");
      // Exit: without reduce the dialog stays rendered (allow-discrete display) while it slides away; with reduce it is gone at once.
      expect(closing.display).toBe(reduce ? "none" : "block");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      expect((await drawerState(page)).display).toBe("none");
      expect(await page.evaluate(() => document.elementFromPoint(40, 300)?.closest("dialog") ?? null)).toBeNull();
    });

    test("crossing 1000px never starts a drawer transition", async ({ page }) => {
      await page.setViewportSize({ width: 1001, height: 900 });
      await openMotionStory(page, "organisms-shell--ready", preference);
      const dialog = page.getByRole("dialog", { name: "Application navigation", includeHidden: true });
      expect((await drawerState(page)).transitions).toEqual([]);
      await page.setViewportSize({ width: 1000, height: 900 });
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
      expect(await drawerState(page)).toMatchObject({ display: "none", transitions: [], open: false });
      // Open at narrow width, then widen: it closes at once with no exit transition and no flash of the panel.
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(dialog).toBeVisible();
      await page.setViewportSize({ width: 1001, height: 900 });
      await expect(dialog).toBeHidden();
      expect(await drawerState(page)).toMatchObject({ display: "none", transitions: [], open: false });
      await expect(page.getByRole("link", { name: "Dataset Explorer" })).toBeFocused();
    });

    test("header shadow is a scroll-linked progressive enhancement: absent at the top, present once scrolled", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 600 });
      await openMotionStory(page, "organisms-shell--ready", preference);
      await page.evaluate(() => { const spacer = document.createElement("div"); spacer.style.height = "3000px"; document.querySelector("main")?.append(spacer); });
      const alpha = () => page.locator("header").evaluate((header) => {
        const shadow = getComputedStyle(header).boxShadow;
        return shadow === "none" ? 0 : Number.parseFloat(/rgba?\((?:[^,]+,){3}\s*([\d.]+)/.exec(shadow)?.[1] ?? "1");
      });
      expect(await alpha()).toBe(0);
      await page.evaluate(() => { window.scrollTo(0, 400); });
      await expect.poll(alpha).toBeGreaterThan(0);
      await page.evaluate(() => { window.scrollTo(0, 0); });
      await expect.poll(alpha).toBe(0);
    });

    test("coverage status dot pulses a single iteration; reduced motion removes the pulse", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await openMotionStory(page, "organisms-shell--coverage-dot", preference);
      const dot = page.locator("aside span.rounded-full.animate-dot-pulse");
      await expect(dot).toHaveCount(1);
      const motion = await readMotion(dot);
      expect(motion.animationName).toBe(reduce ? "none" : "dot-pulse");
      await expect(dot).toHaveCSS("animation-iteration-count", "1");
      if (!reduce) expect(seconds(motion.animationDuration)).toBeCloseTo(1.2, 5);
      await expect(page.locator("aside").getByText("September 30, 2026")).toBeVisible();
    });

    for (const [name, id, count] of [["Overview", "templates-analytical--overview-entrance", 4], ["Explorer", "templates-analytical--explorer-entrance", 3], ["Workspace", "templates-analytical--workspace-entrance", 3]] as const) {
      test(`${name} template slots rise with a capped stagger but are present and operable at once`, async ({ page }) => {
        await openMotionStory(page, id, preference);
        await page.getByRole("button", { name: "Replay entrance" }).click();
        const slots = page.locator(".motion-stagger");
        await expect(slots).toHaveCount(count);
        const entered = await slots.evaluateAll((elements) => elements.map((element) => ({ name: getComputedStyle(element).animationName, delay: getComputedStyle(element).animationDelay, text: element.textContent })));
        for (const slot of entered) expect(slot.name).toBe("fade-rise");
        // Index <= 3 at the 50ms step; reduce zeroes the step and the rise distance.
        const delays = entered.map((slot) => Number.parseFloat(slot.delay));
        expect(Math.max(...delays)).toBeCloseTo(reduce ? 0 : 0.05 * (count - 1), 5);
        expect(await rootToken(page, "--motion-rise")).toBe(reduce ? 0 : 4);
        // Content is in the DOM and operable immediately.
        await expect(page.getByRole("button", { name: "Replay entrance" })).toBeEnabled();
        for (const slot of entered) expect(slot.text).toBeTruthy();
      });
    }

    test("AuthTemplate card scales in and a title change fades the heading while children and actions stay mounted", async ({ page }) => {
      await openMotionStory(page, "templates-authtemplate--state-switch", preference);
      const card = page.locator("main > section");
      await expect(card).toHaveCSS("animation-name", "scale-in");
      expect(await rootToken(page, "--motion-scale-from")).toBe(reduce ? 1 : 0.98);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveText("Sign in to your workspace");
      await expect(heading.locator("xpath=..")).toHaveCSS("animation-name", "fade-in");
      // Identity markers: the keyed block remounts; the action button and the status message do not.
      await page.getByRole("button", { name: "Next state" }).evaluate((button) => { (button as HTMLElement & { marker?: string }).marker = "kept"; });
      await page.getByRole("status").evaluate((status) => { (status as HTMLElement & { marker?: string }).marker = "kept"; });
      await heading.evaluate((element) => { (element as HTMLElement & { marker?: string }).marker = "old"; });
      await page.getByRole("button", { name: "Next state" }).click();
      await expect(heading).toHaveText("Checking session");
      expect(await heading.evaluate((element) => (element as HTMLElement & { marker?: string }).marker)).toBeUndefined();
      expect(await page.getByRole("button", { name: "Next state" }).evaluate((button) => (button as HTMLElement & { marker?: string }).marker)).toBe("kept");
      await expect(page.getByRole("status")).toHaveCount(1);
    });

    test("DataTable rows stagger on mount (first ten, 20ms step), cells identical, and entrance none skips it", async ({ page }) => {
      await openMotionStory(page, "organisms-data-table--staggered-rows", preference);
      const rows = page.locator("#storybook-root tbody tr");
      await expect(rows).toHaveCount(14);
      const staggered = await rows.evaluateAll((elements) => elements.map((row) => ({ name: getComputedStyle(row).animationName, delay: Number.parseFloat(getComputedStyle(row).animationDelay) })));
      expect(staggered.slice(0, 10).every((row) => row.name === "fade-rise")).toBe(true);
      expect(staggered.slice(10).every((row) => row.name === "none")).toBe(true);
      expect(staggered[9]?.delay).toBeCloseTo(reduce ? 0 : 0.18, 5);
      const cells = await page.locator("#storybook-root tbody td").allTextContents();
      await openMotionStory(page, "organisms-data-table--no-entrance", preference);
      expect(await page.locator("#storybook-root tbody tr").evaluateAll((elements) => elements.every((row) => getComputedStyle(row).animationName === "none"))).toBe(true);
      expect(await page.locator("#storybook-root tbody td").allTextContents()).toEqual(cells);
    });

    test("chart wipe clips only the persistent svg; the chart is fully visible once it ends and never without it under reduce", async ({ page }) => {
      await openMotionStory(page, "features-overview--ready", preference);
      const chart = page.locator("svg[data-chart=national-trend]");
      await expect(chart).toBeVisible();
      await expect(chart).toHaveCSS("animation-name", reduce ? "none" : "chart-wipe");
      // The wipe only clips (never moves points): its single keyframe is a left-to-right clip inset.
      const keyframe = await page.evaluate(() => {
        for (const sheet of Array.from(document.styleSheets)) for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSKeyframesRule && rule.name === "chart-wipe") return Array.from(rule.cssRules).map((frame) => (frame as CSSKeyframeRule).cssText.replace(/\s+/g, " "));
        }
        return [];
      });
      expect(keyframe).toHaveLength(1);
      expect(keyframe[0]).toMatch(/^(?:from|0%) \{ clip-path: inset\(0(?:px)? 100% 0(?:px)? 0(?:px)?\); \}$/);
      // The end state is the unclipped chart: reduce has no wipe at all, motion shows it fully revealed.
      await expect(chart).toHaveCSS("clip-path", "none");
      expect(await chart.locator("polyline[data-segment=observed]").count()).toBeGreaterThan(0);
      // Compare toggle: the svg survives (identity marker) so the wipe cannot replay.
      await chart.evaluate((element) => { (element as unknown as { marker?: string }).marker = "persistent"; });
      await page.getByRole("checkbox", { name: "Compare EIA reported %" }).check();
      await expect(chart.locator("g[data-series=reported]")).toHaveCount(1);
      expect(await chart.evaluate((element) => (element as unknown as { marker?: string }).marker)).toBe("persistent");
      expect(await page.locator("svg[data-chart=national-trend]").count()).toBe(1);
    });

    test("range change dims the retained series inert and hidden, then wipes in the new chart", async ({ page }) => {
      await openMotionStory(page, "features-overview--range-change-refetch", preference);
      await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
      await page.getByRole("button", { name: "Hold next series response" }).click();
      await page.getByLabel("End date").fill("2026-09-03");
      const retained = page.locator("[inert][aria-hidden=true]");
      await expect(retained).toHaveCount(3);
      await expect(page.getByRole("status")).toHaveText("Loading national observations");
      await expect(retained.first()).toHaveCSS("opacity", "0.5");
      // Stale content is absent from the accessibility tree and cannot be used.
      await expect(page.getByRole("table", { name: "Daily national observations" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Explore dataset" })).toHaveCount(0);
      expect(await page.locator("dl[aria-busy=true]").count()).toBe(0);
      await page.getByRole("button", { name: "Release response" }).click();
      await expect(page.locator("[inert]")).toHaveCount(0);
      await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
      await expect(page.locator("svg[data-chart=national-trend]")).toHaveCSS("animation-name", reduce ? "none" : "chart-wipe");
      await expect(page.locator("svg[data-chart=national-trend]")).toHaveCSS("clip-path", "none");
    });
  });
}

test.describe("data identical with motion on and off", () => {
  async function chartData(page: Page) {
    return page.evaluate(() => ({
      segments: Array.from(document.querySelectorAll("polyline[data-segment=observed]")).map((line) => line.getAttribute("points")),
      circles: Array.from(document.querySelectorAll("svg[data-chart=national-trend] circle")).map((circle) => `${circle.getAttribute("cx") ?? ""},${circle.getAttribute("cy") ?? ""}`),
      cells: Array.from(document.querySelectorAll("#storybook-root tbody td")).map((cell) => cell.textContent),
      metrics: Array.from(document.querySelectorAll("dl")).map((metric) => metric.textContent),
    }));
  }

  test("polyline points, gap segments, cells and metrics match with motion on, off and reduced", async ({ page }) => {
    await openStory(page, "features-overview--ready", "off");
    await expect(page.locator("svg[data-chart=national-trend]")).toHaveCSS("clip-path", "none");
    const off = await chartData(page);
    expect(off.segments.length).toBeGreaterThan(1);
    await openStory(page, "features-overview--ready", "on");
    await expect(page.locator("svg[data-chart=national-trend]")).toHaveCSS("clip-path", "none");
    expect(await chartData(page)).toEqual(off);
    await openMotionStory(page, "features-overview--ready", "reduce");
    await expect(page.locator("svg[data-chart=national-trend]")).toHaveCSS("animation-name", "none");
    expect(await chartData(page)).toEqual(off);
  });

  test("with the motion-off sheet the wipe has no clipped state to observe", async ({ page }) => {
    await openStory(page, "features-overview--ready", "off");
    const chart = page.locator("svg[data-chart=national-trend]");
    await expect(chart).toBeVisible();
    await expect(chart).toHaveCSS("clip-path", "none");
    await expect(chart).toHaveCSS("animation-duration", "0s");
    expect(await page.evaluate(() => document.querySelector("svg[data-chart=national-trend]")?.getAnimations().length ?? -1)).toBe(0);
  });
});
