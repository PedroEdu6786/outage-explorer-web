import { expect, test, type Locator } from "@playwright/test";
import { openMotionStory } from "./support";

const sample = (chart: Locator, progress?: number) => chart.evaluate((node, fraction) => {
  const projection = node.querySelector<SVGGElement>(".motion-chart-viewport");
  if (!projection) throw new Error("Projection missing");
  // Force style resolution before inspecting newly created native transitions.
  getComputedStyle(projection).getPropertyValue("--chart-x-scale");
  const animations = projection.getAnimations();
  if (fraction !== null) {
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = Number(animation.effect?.getTiming().duration ?? 0) * fraction;
    }
  }
  const point = Array.from(node.querySelectorAll<SVGCircleElement>("[data-series=calculated] circle"))
    .find((circle) => circle.textContent.startsWith("2026-06-09:"));
  if (!point) throw new Error("Exact fixture point missing");
  const style = getComputedStyle(point);
  const line = point.parentElement?.querySelector<SVGPolylineElement>("polyline");
  if (!line) throw new Error("Observed line missing");
  const linePoint = Array.from(line.points).find((p) => p.x === 159);
  if (!linePoint) throw new Error("Exact fixture line point missing");
  const matrix = new DOMMatrix(getComputedStyle(line).transform);
  return {
    count: animations.length, cx: parseFloat(style.cx), target: Number(point.getAttribute("cx")),
    cy: parseFloat(style.cy), radius: style.r, label: point.textContent,
    lineX: matrix.a * linePoint.x + matrix.e, lineY: matrix.d * linePoint.y + matrix.f,
    duration: getComputedStyle(projection).transitionDuration,
  };
}, progress ?? null);

const finish = (chart: Locator) => chart.evaluate((node) => {
  node.querySelector(".motion-chart-viewport")?.getAnimations().forEach((animation) => { animation.finish(); });
});

for (const preference of ["no-preference", "reduce"] as const) {
  test(`viewport projects source geometry smoothly with ${preference}`, async ({ page }) => {
    await openMotionStory(page, "features-overview-nationaltrend--one-year", preference);
    const chart = page.locator("svg[data-chart=national-trend]");
    await chart.evaluate(async (node) => { await Promise.all(node.getAnimations().map((animation) => animation.finished)); });
    await page.getByRole("checkbox", { name: "Zoom mode" }).check();
    const before = await sample(chart);
    await page.getByRole("button", { name: "Zoom in", exact: true }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    const midway = await sample(chart, 0.25);
    if (preference === "reduce") {
      expect(midway.count).toBe(0); expect(midway.cx).toBeCloseTo(midway.target, 2);
    } else {
      expect(midway.count).toBe(2); expect(midway.duration).toBe("0.2s");
      expect(midway.cx).toBeGreaterThan(Math.min(before.cx, midway.target));
      expect(midway.cx).toBeLessThan(Math.max(before.cx, midway.target));
    }
    expect(midway.lineX).toBeCloseTo(midway.cx, 2);
    expect(midway.lineY).toBeCloseTo(midway.cy, 2);
    expect(midway.cy).toBe(before.cy); expect(midway.radius).toBe(before.radius);
    expect(midway.label).toBe("2026-06-09: Calculated 1.01%");
    await finish(chart);
    expect((await sample(chart)).cx).toBeCloseTo(midway.target, 2);
    // Retarget the running projection with keyboard pan, then immediately reset.
    const region = page.getByRole("region", { name: "National trend: scrollable chart" });
    await region.focus(); await page.keyboard.press("ArrowRight");
    const panning = await sample(chart, 0.25);
    if (preference !== "reduce") expect(panning.count).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Reset zoom" }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    const retargeted = await sample(chart, 0);
    if (preference !== "reduce") expect(retargeted.cx).toBeCloseTo(panning.cx, 2);
    else expect(retargeted.cx).toBeCloseTo(retargeted.target, 2);
    await sample(chart, 0.5); await finish(chart);
    expect((await sample(chart)).cx).toBeCloseTo(before.cx, 2);
    // Disabling snaps the in-flight presentation to its accepted target window.
    await page.getByRole("button", { name: "Zoom in", exact: true }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    await sample(chart, 0.25);
    await page.getByRole("checkbox", { name: "Zoom mode" }).evaluate((node) => { (node as HTMLInputElement).click(); });
    const disabled = await sample(chart);
    expect(disabled.cx).toBeCloseTo(disabled.target, 2);
    // Reset is still usable and animated while mode is off.
    await page.getByRole("button", { name: "Reset zoom" }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    const reset = await sample(chart, 0.25);
    expect(reset.count).toBe(preference === "reduce" ? 0 : 2);
    await finish(chart); expect((await sample(chart)).cx).toBeCloseTo(before.cx, 2);
  });
}

test("motion-off captures target projection immediately", async ({ page }) => {
  await page.goto("/iframe.html?id=features-overview-nationaltrend--one-year&viewMode=story&globals=motion:off");
  await page.getByRole("checkbox", { name: "Zoom mode" }).check();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const state = await sample(page.locator("svg[data-chart=national-trend]"));
  expect(state.count).toBe(0); expect(state.cx).toBeCloseTo(state.target, 2);
});


test("identity and unavailable changes cancel pending viewport presentation", async ({ page }) => {
  await openMotionStory(page, "features-overview-nationaltrend--motion-lifecycle");
  const chart = page.locator("svg[data-chart=national-trend]");
  await expect(chart).toBeVisible();
  await chart.evaluate(async (node) => { await Promise.all(node.getAnimations().map((animation) => animation.finished)); });
  for (const action of ["Apply explicit bounds", "Change snapshot", "Make unavailable"]) {
    await page.getByRole("checkbox", { name: "Zoom mode" }).check();
    await page.getByRole("button", { name: "Zoom in", exact: true }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    expect((await sample(chart, 0.25)).count).toBeGreaterThan(0);
    await page.getByRole("button", { name: action }).evaluate((node) => { (node as HTMLButtonElement).click(); });
    const result = await sample(chart);
    expect(result.count).toBe(0); expect(result.cx).toBeCloseTo(result.target, 2);
  }
  await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeDisabled();
});

test("native wheel burst settles naturally in a narrow scrollable chart", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMotionStory(page, "features-overview-nationaltrend--one-year");
  const chart = page.locator("svg[data-chart=national-trend]");
  await chart.evaluate(async (node) => { await Promise.all(node.getAnimations().map((animation) => animation.finished)); });
  await page.getByRole("checkbox", { name: "Zoom mode" }).check();
  await chart.scrollIntoViewIfNeeded();
  const point = await chart.evaluate((node) => {
    const svg = node as SVGSVGElement;
    const point = svg.createSVGPoint(); point.x = 150; point.y = 150;
    const matrix = svg.getScreenCTM();
    if (!matrix) throw new Error("Chart not rendered");
    const client = point.matrixTransform(matrix);
    return { x: client.x, y: client.y };
  });
  await page.mouse.move(point.x, point.y);
  const before = await sample(chart);
  await page.mouse.wheel(0, -60); await page.mouse.wheel(0, -60);
  await expect.poll(async () => (await sample(chart)).target).not.toBe(before.target);
  await expect.poll(async () => Math.abs((await sample(chart)).cx - (await sample(chart)).target)).toBeLessThan(0.01);
  const settled = await sample(chart);
  expect(settled.lineX).toBeCloseTo(settled.cx, 2); expect(settled.count).toBe(0);
});
