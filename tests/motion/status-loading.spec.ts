import { expect, test, type Locator, type Page } from "@playwright/test";
import { openMotionStory, readMotion, rootToken, seconds, type MotionPreference } from "./support";

const preferences: readonly MotionPreference[] = ["no-preference", "reduce"];

/** Navigate to a story with motion explicitly on or off (the default) and wait for fonts. */
async function openStory(page: Page, id: string, motion: "on" | "off") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=motion:${motion}`);
  await expect(page.getByRole("note").first()).toHaveText("Synthetic fixture preview — not live EIA data.");
  await page.evaluate(async () => { await document.fonts.ready; });
}

async function liveRegionCount(page: Page) {
  return page.locator("[role=status], [role=alert], [aria-live]").count();
}

/**
 * Animations under `root` other than the one-shot row entrance (`fade-rise` on mount, phase 3):
 * dimming and loading themselves never animate.
 */
async function animationsUnder(root: Locator) {
  return root.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => (animation as CSSAnimation).animationName !== "fade-rise").length);
}

for (const preference of preferences) {
  const reduce = preference === "reduce";

  test.describe(`status and loading with ${preference}`, () => {
    test("StatusMessage fades in, crossfades its icon and settles success without adding live regions", async ({ page }) => {
      await openMotionStory(page, "molecules-displays--status-switch-review", preference);
      const live = page.getByRole("status");
      await expect(live).toHaveCount(1);
      await expect(live).toHaveText("Loading previewWaiting for the selected records.");
      const banner = live.locator("xpath=..");
      expect(await rootToken(page, "--motion-rise")).toBe(reduce ? 0 : 4);
      const entered = await readMotion(banner);
      expect(entered.animationName).toBe("fade-rise");
      expect(seconds(entered.animationDuration)).toBeCloseTo(reduce ? 0.1 : 0.26, 5);
      expect(entered.transitionProperty).toContain("border-color");
      expect(seconds(entered.transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      // The decorative icon wrapper is hidden from assistive technology and fades in when swapped.
      const icon = banner.locator("> span[aria-hidden=true]");
      await expect(icon).toHaveCSS("animation-name", "fade-in");

      await page.getByRole("button", { name: "Next status" }).click();
      await expect(live).toHaveCount(1);
      await expect(live).toHaveText("CompleteThe requested content is available.");
      await expect(banner).toHaveCSS("animation-name", "fade-rise, settle");
      await expect(banner).toHaveCSS("border-top-color", "rgb(201, 226, 212)");
      await expect(banner.locator("> span[aria-hidden=true]")).toHaveText("✓");

      await page.getByRole("button", { name: "Next status" }).click();
      await expect(live).toHaveText("Partial resultOnly retained records are shown.");
      await expect(banner).toHaveCSS("animation-name", "fade-rise");
      await expect(banner).toHaveCSS("border-top-color", "rgb(152, 103, 27)");

      await page.getByRole("button", { name: "Next status" }).click();
      expect(await liveRegionCount(page)).toBe(1);
      await expect(page.getByRole("alert")).toHaveText("UnavailableYour input has been retained.");
      // No shake: the status banner never uses the control nudge.
      expect(await page.locator("[role=alert]").evaluate((element) => getComputedStyle(element.parentElement as Element).animationName)).not.toBe("nudge");
    });

    test("Spinner fades in over the appear token and keeps its accessible text", async ({ page }) => {
      await openMotionStory(page, "atoms-status-and-surfaces--spinner-fade-in-review", preference);
      await page.getByRole("button", { name: "Start loading" }).click();
      const spinner = page.getByRole("status");
      await expect(spinner).toHaveCount(1);
      await expect(spinner).toHaveText("Loading preview");
      const root = await readMotion(spinner);
      expect(root.animationName).toBe("fade-in");
      expect(seconds(root.animationDuration)).toBeCloseTo(reduce ? 0.1 : 0.15, 5);
      expect(await rootToken(page, "--duration-appear")).toBeCloseTo(reduce ? 0.1 : 0.15, 5);
      await expect(spinner.locator("span[aria-hidden=true]")).toHaveCSS("animation-name", reduce ? "none" : "spinner");
    });

    test("EmptyState staggers icon, title and description and keeps its text", async ({ page }) => {
      await openMotionStory(page, "molecules-displays--empty-state-review", preference);
      const title = page.getByRole("heading", { name: "No matching records", level: 2 });
      await expect(title).toBeVisible();
      await expect(page.getByText("Change the supplied filters to browse again.")).toBeVisible();
      const motion = await readMotion(title);
      expect(motion.animationName).toBe("fade-rise");
      expect(seconds(motion.animationDuration)).toBeCloseTo(reduce ? 0.1 : 0.26, 5);
      await expect(title).toHaveCSS("animation-delay", reduce ? "0s" : "0.05s");
      await expect(page.getByText("Change the supplied filters to browse again.")).toHaveCSS("animation-delay", reduce ? "0s" : "0.1s");
      await expect(page.getByRole("button", { name: "Clear filters" })).toBeEnabled();
    });

    test("pagination current-page highlight crossfades color only", async ({ page }) => {
      await openMotionStory(page, "molecules-paginationcontrols--current-page-review", preference);
      const one = page.getByRole("button", { name: "1", exact: true });
      const two = page.getByRole("button", { name: "2", exact: true });
      await expect(one).toHaveAttribute("aria-current", "page");
      await expect(one).toHaveCSS("background-color", "rgb(8, 125, 130)");
      expect(seconds((await readMotion(two)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      expect((await readMotion(two)).transitionProperty).toContain("background-color");
      await two.focus();
      await page.keyboard.press("Space");
      await expect(two).toHaveAttribute("aria-current", "page");
      await expect(one).not.toHaveAttribute("aria-current");
      await expect(two).toHaveCSS("background-color", "rgb(8, 125, 130)");
      await expect(one).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(page.getByText("Retained page 2")).toBeVisible();
    });

    test("DateRangeField validation eases color; the nudge only plays without reduce", async ({ page }) => {
      await openMotionStory(page, "molecules-fields--validation-review", preference);
      const fields = page.locator("fieldset");
      const spaced = fields.nth(0);
      const compact = fields.nth(1);
      await expect(spaced.getByLabel("Start date")).not.toHaveAttribute("aria-invalid");
      expect(seconds((await readMotion(compact)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      expect((await readMotion(compact)).transitionProperty).toContain("border-color");
      await page.getByRole("button", { name: "Mark invalid" }).click();
      await expect(spaced.getByLabel("Start date")).toHaveAttribute("aria-invalid", "true");
      await expect(spaced.getByLabel("Start date")).toHaveCSS("border-top-color", "rgb(173, 61, 61)");
      await expect(spaced.getByLabel("Start date")).toHaveCSS("animation-name", reduce ? "none" : "nudge");
      await expect(compact).toHaveCSS("border-top-color", "rgb(173, 61, 61)");
      await expect(page.getByText("Synthetic error: start is after end.")).toHaveCount(2);
      await page.getByRole("button", { name: "Mark valid" }).click();
      await expect(compact).toHaveCSS("border-top-color", "rgb(220, 227, 231)");
      await expect(spaced.getByLabel("Start date")).not.toHaveAttribute("aria-invalid");
    });

    test("skeletons are decorative, text-free, never animated and carry no shimmer", async ({ page }) => {
      for (const id of ["atoms-status-and-surfaces--skeleton-blocks", "molecules-displays--table-placeholder", "features-overview--loading"]) {
        await openMotionStory(page, id, preference);
        const hidden = page.locator("span[aria-hidden=true].bg-border, div[aria-hidden=true].text-\\[11px\\]");
        await expect(hidden.first()).toBeVisible();
        const report = await page.evaluate(() => {
          const blocks = Array.from(document.querySelectorAll("span.bg-border[aria-hidden=true]"));
          return {
            count: blocks.length,
            texts: blocks.map((block) => block.textContent),
            animations: blocks.map((block) => getComputedStyle(block).animationName),
            running: blocks.reduce((total, block) => total + block.getAnimations().length, 0),
            shimmer: document.querySelectorAll("[class*=shimmer]").length,
          };
        });
        expect(report.count, id).toBeGreaterThan(0);
        expect(report.texts.every((text) => text === ""), id).toBe(true);
        expect(report.animations.every((name) => name === "none"), id).toBe(true);
        expect(report.running, id).toBe(0);
        expect(report.shimmer, id).toBe(0);
      }
    });

    test("DataTable loading dims retained rows (opacity only) and keeps them inert and hidden", async ({ page }) => {
      await openMotionStory(page, "organisms-data-table--loading-retained", preference);
      const dimmed = page.locator("[aria-busy=true][inert]");
      await expect(dimmed).toHaveCount(1);
      await expect(dimmed).toHaveAttribute("aria-hidden", "true");
      await expect(dimmed).toHaveCSS("opacity", "0.6");
      expect(seconds((await readMotion(dimmed)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
      expect((await readMotion(dimmed)).transitionProperty).toContain("opacity");
      expect(await animationsUnder(dimmed)).toBe(0);
      await expect(page.getByRole("table")).toHaveCount(0);
      await page.getByRole("button", { name: "Finish loading" }).click();
      await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
      await expect(page.getByRole("table", { name: "Synthetic retained page" })).toBeVisible();
      await expect(page.getByRole("table", { name: "Synthetic retained page" }).locator("xpath=../..")).toHaveCSS("opacity", "1");
    });

    test("MetricValue shows a placeholder, then the exact provided value, never zero or Unavailable", async ({ page }) => {
      await openMotionStory(page, "molecules-displays--metric-loading-review", preference);
      const metric = page.locator("dl");
      await expect(metric).toHaveAttribute("aria-busy", "true");
      await expect(metric).not.toContainText(/0|Unavailable|MW/);
      await page.getByRole("button", { name: "Finish loading" }).click();
      await expect(page.getByText("1.005000")).toBeVisible();
      await expect(metric).not.toHaveAttribute("aria-busy");
      const motion = await readMotion(page.locator("dd").first());
      expect(motion.animationName).toBe("fade-in");
      expect(seconds(motion.animationDuration)).toBeCloseTo(reduce ? 0.1 : 0.15, 5);
    });

    test("Explorer and SQL paging dim the retained page without data motion", async ({ page }) => {
      for (const [id, region] of [["features-explorer--paging", "Loading preview"], ["features-queries--paging", "Next"]] as const) {
        await openMotionStory(page, id, preference);
        const dimmed = page.locator("[aria-busy=true][inert]");
        await expect(dimmed).toHaveCount(1);
        await expect(dimmed).toHaveCSS("opacity", "0.6");
        await expect(dimmed).toHaveAttribute("aria-hidden", "true");
        expect(await animationsUnder(dimmed), id).toBe(0);
        if (region === "Loading preview") await expect(page.getByText(region)).toHaveCount(1);
        else await expect(page.getByRole("button", { name: region })).toBeDisabled();
      }
    });
  });
}

test.describe("loading states keep data identical with motion on and off", () => {
  async function texts(page: Page, id: string, motion: "on" | "off", table: string, cells: string) {
    await openStory(page, id, motion);
    // The paging story holds its next page open, so its retained rows are the dimmed (hidden) table.
    if (table === "") await expect(page.locator("[aria-busy=true][inert]")).toBeVisible();
    else await expect(page.getByRole("table", { name: table }).first()).toBeVisible();
    // Wait for any settling play function or fade to finish by observing a stable text snapshot.
    let previous = "";
    await expect.poll(async () => {
      const current = (await page.locator(cells).allTextContents()).join("|");
      const stable = current === previous && current !== "";
      previous = current;
      return stable;
    }).toBe(true);
    return page.locator(cells).allTextContents();
  }

  for (const [name, id, table, cells] of [
    ["Overview", "features-overview--ready", "Daily national observations", "dl, td"],
    ["Explorer", "features-explorer--analyst", "Synthetic national observations preview", "td"],
    ["Queries (retained page)", "features-queries--paging", "", "[aria-busy=true][inert] td"],
  ] as const) {
    test(`${name} metrics and cells are identical`, async ({ page }) => {
      const off = await texts(page, id, "off", table, cells);
      const on = await texts(page, id, "on", table, cells);
      expect(on.length).toBeGreaterThan(0);
      expect(on).toEqual(off);
    });
  }
});

test.describe("skeleton geometry matches the content it stands in for", () => {
  test("Overview skeleton cards are as tall as the loaded cards", async ({ page }) => {
    const heights = async (id: string) => {
      await openStory(page, id, "off");
      await expect(page.locator("dl").first()).toBeVisible();
      await page.waitForTimeout(0);
      return page.locator("dl").evaluateAll((nodes) => nodes.map((node) => Math.round(node.closest("div")?.getBoundingClientRect().height ?? 0)));
    };
    const loading = await heights("features-overview--loading");
    await expect(page.locator("dl[aria-busy=true]")).toHaveCount(3);
    const loaded = await heights("features-overview--ready");
    expect(loading).toHaveLength(3);
    expect(loaded).toHaveLength(3);
    loading.forEach((height, index) => { expect(Math.abs(height - (loaded[index] ?? 0)), `card ${String(index)}`).toBeLessThanOrEqual(1); });
  });

  test("Explorer preview skeleton rows match real row and header heights", async ({ page }) => {
    const geometry = async (id: string, selector: string) => {
      await openStory(page, id, "off");
      await expect(page.locator(selector).first()).toBeVisible();
      return page.evaluate((sel) => {
        const rows = Array.from(document.querySelectorAll(sel));
        return rows.map((row) => Math.round(row.getBoundingClientRect().height * 10) / 10);
      }, selector);
    };
    const skeleton = await geometry("features-explorer--loading", "[aria-busy=true] > div[aria-hidden=true] > div");
    const real = await geometry("features-explorer--analyst", "[role=tabpanel]:not([hidden]) table tr");
    expect(skeleton.length).toBeGreaterThan(1);
    expect(real.length).toBeGreaterThan(1);
    // Header, then body rows.
    expect(Math.abs((skeleton[0] ?? 0) - (real[0] ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((skeleton[1] ?? 0) - (real[1] ?? 0))).toBeLessThanOrEqual(1);
  });
});
