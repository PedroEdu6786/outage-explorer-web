import { expect, test } from "@playwright/test";
import { openMotionStory, readMotion, seconds, type MotionPreference } from "./support";

for (const preference of ["no-preference", "reduce"] as const satisfies readonly MotionPreference[]) {
  const reduce = preference === "reduce";
  test.describe(`feature micro-interactions with ${preference}`, () => {
    test("compare only fades the new series; inspected observation enters without changing points or gaps", async ({ page }) => {
      await openMotionStory(page, "features-overview--ready", preference);
      const chart = page.locator("svg[data-chart=national-trend]");
      await expect(chart).toBeVisible();
      const points = await chart.locator("g[data-series=calculated] polyline").evaluateAll((lines) => lines.map((line) => line.getAttribute("points")));
      await chart.evaluate((element) => { element.setAttribute("data-persistent", "yes"); });
      await page.getByRole("checkbox", { name: "Compare EIA reported %" }).check();
      await expect(chart.locator("g[data-series=reported]")).toHaveCSS("animation-name", "fade-in");
      await expect(chart).toHaveAttribute("data-persistent", "yes");
      expect(await chart.locator("g[data-series=calculated] polyline").evaluateAll((lines) => lines.map((line) => line.getAttribute("points")))).toEqual(points);
      await page.getByRole("combobox", { name: "Inspect observation" }).selectOption("2026-09-01");
      const card = page.getByRole("status").filter({ hasText: "Calculated offline:" });
      await expect(card).toHaveCSS("animation-name", "fade-rise");
      await expect(card).toContainText("EIA reported:");
      await expect(card).toHaveCSS("translate", /^(?:none|0px(?: 0px)?)$/);
    });

    test("coverage date mounts a single pulse and honors reduced motion", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await openMotionStory(page, "organisms-shell--coverage-date-change", preference);
      const old = page.locator("aside").getByText("September 30, 2026", { exact: true });
      await old.evaluate((element) => { element.setAttribute("data-old", "yes"); });
      await page.getByRole("button", { name: "Change coverage date" }).click();
      const date = page.locator("aside").getByText("October 1, 2026", { exact: true });
      await expect(date).toHaveCSS("animation-name", reduce ? "none" : "dot-pulse");
      await expect(date).toHaveCSS("animation-iteration-count", "1");
      await expect(date).not.toHaveAttribute("data-old");
    });

    test("dataset row accent jumps under reduce; switch fades only presentation and filters keep focus", async ({ page }) => {
      await openMotionStory(page, "features-explorer--analyst", preference);
      const national = page.getByRole("button", { name: /Synthetic national observations/ });
      const facility = page.getByRole("button", { name: /Synthetic facility observations/ });
      await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
      const before = await readMotion(facility);
      expect(before.transitionProperty).toContain("border-left-width");
      expect(seconds(before.transitionDuration)).toBeCloseTo(reduce ? 0 : 0.2, 5);
      await facility.click();
      await expect(facility).toBeFocused();
      await expect(page.getByRole("table", { name: "Synthetic facility observations preview" })).toBeVisible();
      await expect(page.locator("header > .animate-fade-in")).toHaveCSS("animation-name", "fade-in");
      await expect(page.locator("[aria-busy] > .animate-fade-in").first()).toHaveCSS("animation-name", "fade-in");
      await expect(page.getByRole("button", { name: "Open in SQL Workspace" })).toBeEnabled();
      await national.click();
      await page.getByRole("tab", { name: "Schema", exact: true }).click();
      const schema = page.getByRole("table", { name: "Authorized dataset schema" });
      await expect(schema).toBeVisible();
      await expect(schema).toHaveCSS("animation-name", "fade-in");
      await page.getByRole("tab", { name: "Preview", exact: true }).click();
      const start = page.getByLabel("Start date"); await start.fill("2026-09-02");
      await expect(start).toBeFocused();
      const form = start.locator("xpath=ancestor::form");
      expect(seconds((await readMotion(form)).transitionDuration)).toBeCloseTo(reduce ? 0.06 : 0.12, 5);
    });

    test("busy bar exists only while running and is static under reduce", async ({ page }) => {
      await openMotionStory(page, "features-queries--running", preference);
      const bar = page.locator(".animate-progress");
      await expect(bar).toHaveCount(1);
      await expect(bar.locator("xpath=..")).toHaveAttribute("aria-hidden", "true");
      await expect(bar).toHaveCSS("animation-name", reduce ? "none" : "progress");
      await expect(page.getByRole("status").filter({ hasText: "Executing query" })).toHaveCount(1);
      await openMotionStory(page, "features-queries--analyst-results", preference);
      await expect(page.getByRole("table", { name: "SQL query results" })).toBeVisible();
      await expect(page.locator(".animate-progress")).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Retained query results" })).toHaveCSS("animation-name", "fade-in");
    });

    test("Copy swaps the decorative icon and returns; schema expands then collapses immediately", async ({ page }) => {
      await page.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.resolve() } }); });
      await openMotionStory(page, "features-queries--analyst-ready", preference);
      const copy = page.getByRole("button", { name: "Copy", exact: true });
      const idle = await copy.locator("svg").innerHTML();
      await copy.click();
      await expect(page.getByRole("status").filter({ hasText: "SQL copied" })).toHaveCount(1);
      await expect(copy.locator("span[aria-hidden=true]")).toHaveCSS("animation-name", "icon-swap");
      expect(await copy.locator("svg").innerHTML()).not.toBe(idle);
      await expect.poll(() => copy.locator("svg").innerHTML()).toBe(idle);
      await openMotionStory(page, "features-queries--schema-collapse", preference);
      const dataset = page.getByRole("button", { name: "synthetic_national", exact: true });
      await dataset.click();
      await expect(dataset).toHaveAttribute("aria-expanded", "true");
      await expect(dataset.locator(".motion-chevron")).toHaveCSS("rotate", "90deg");
      expect(seconds((await readMotion(dataset.locator(".motion-chevron"))).transitionDuration)).toBeCloseTo(reduce ? 0 : 0.2, 5);
      await expect(page.locator(".animate-expand")).toHaveCSS("animation-name", reduce ? "none" : "expand");
      await expect(page.getByText("Schema labels are a reference; no SQL is inserted or run.")).toBeVisible();
      const collapsed = await dataset.evaluate((element) => { (element as HTMLElement).click(); return new Promise<boolean>((resolve) => { requestAnimationFrame(() => { resolve(document.querySelector(".animate-expand") === null); }); }); });
      expect(collapsed).toBe(true);
      await expect(dataset).toHaveAttribute("aria-expanded", "false");
    });
  });
}

for (const [name, id, ready] of [
  ["Overview", "features-overview--compare", "svg[data-chart=national-trend]"],
  ["Explorer", "features-explorer--analyst", "table"],
  ["Queries", "features-queries--analyst-results", "table"],
] as const) {
  test(`${name} text, table cells and chart geometry are identical with motion on and off`, async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
    const sample = async (motion: "on" | "off") => {
      await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=motion:${motion}`);
      await expect(page.locator("#storybook-root").locator(ready).first()).toBeVisible();
      if (name === "Overview") await expect(page.locator("g[data-series=reported]")).toHaveCount(1);
      return page.locator("#storybook-root").evaluate((root) => { const copy = root.cloneNode(true) as HTMLElement; copy.querySelectorAll("style").forEach((style) => { style.remove(); }); return { text: copy.textContent, cells: Array.from(root.querySelectorAll("td")).map((cell) => cell.textContent), points: Array.from(root.querySelectorAll("polyline")).map((line) => line.getAttribute("points")) }; });
    };
    expect(await sample("on")).toEqual(await sample("off"));
  });
}
