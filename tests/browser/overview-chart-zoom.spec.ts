import { test, expect, type Page, type CDPSession } from "@playwright/test";
import { openPage } from "./support/page-boundary";

const chart = (page: Page) => page.locator("svg[data-chart=national-trend]");
const region = (page: Page) => page.getByRole("region", { name: "National trend: scrollable chart" });
const mode = (page: Page) => page.getByRole("checkbox", { name: "Zoom mode" });
const caption = (page: Page) => page.getByText(/^Visible dates:/);
const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;

async function dates(page: Page) {
  const text = await caption(page).innerText();
  const found = /(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/.exec(text);
  if (!found?.[1] || !found[2]) throw new Error("Resolved chart dates required");
  return { start: found[1], end: found[2], days: day(found[2]) - day(found[1]) + 1 };
}

async function plotPoint(page: Page, anchor = 0.5) {
  await region(page).scrollIntoViewIfNeeded();
  // Deliberately move the native SVG scrollbar on narrow screens; CTM must
  // account for that movement exactly once.
  await region(page).evaluate((node, fraction) => { node.scrollLeft = Math.max(0, 60 + 810 * fraction - node.clientWidth / 2); }, anchor);
  return chart(page).evaluate((svg: SVGSVGElement, fraction) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) throw new Error("SVG geometry required");
    const point = svg.createSVGPoint(); point.x = 60 + 810 * fraction; point.y = 150;
    const mapped = point.matrixTransform(matrix);
    return { x: mapped.x, y: mapped.y };
  }, anchor);
}

async function wheel(page: Page, dx: number, dy: number, anchor = 0.5) {
  const point = await plotPoint(page, anchor);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(dx, dy);
}

for (const width of [1440, 390]) {
  test(`wheel anchor, pan, limits and reset survive scroll/resize at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openPage(page, "overview--two-year-zoom"); await expect(chart(page)).toBeVisible();
    await mode(page).check(); await chart(page).evaluate((node) => { node.setAttribute("data-persistent", "yes"); });
    for (const nextWidth of [width, width === 1440 ? 1100 : 480]) {
      await page.setViewportSize({ width: nextWidth, height: 1000 });
      const before = await dates(page);
      await wheel(page, 0, -120, 0.25);
      await expect.poll(async () => (await dates(page)).days).toBeLessThan(before.days);
      const after = await dates(page);
      expect(Math.abs(day(after.start) + (after.days - 1) * 0.25 - day(before.start) - (before.days - 1) * 0.25)).toBeLessThanOrEqual(1);
    }
    const beforePan = await dates(page); await wheel(page, 120, 1);
    await expect.poll(async () => (await dates(page)).start).not.toBe(beforePan.start);
    expect((await dates(page)).days).toBe(beforePan.days);
    for (let step = 0; step < 25 && await page.getByRole("button", { name: "Zoom in", exact: true }).isEnabled(); step += 1) {
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    }
    expect((await dates(page)).days).toBe(15);
    await wheel(page, 100_000, 0); await expect.poll(async () => (await dates(page)).end).toBe("2026-12-31");
    await wheel(page, -100_000, 0); await expect.poll(async () => (await dates(page)).start).toBe("2025-01-01");
    await page.getByRole("button", { name: "Reset zoom" }).click();
    await expect(caption(page)).toHaveText("Visible dates: 2025-01-01 to 2026-12-31");
    await expect(chart(page)).toHaveAttribute("data-persistent", "yes");
  });

  test(`page scrolling and browser modifiers coexist with opt-in plot input at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openPage(page, "overview--long-range-zoom"); await expect(chart(page)).toBeVisible();
    const full = await caption(page).innerText();
    const point = await plotPoint(page); const beforeScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(point.x, point.y); await page.mouse.wheel(0, 180);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll);
    await expect(caption(page)).toHaveText(full);
    await mode(page).check(); await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    const narrowed = await caption(page).innerText();
    const ownedPoint = await plotPoint(page); const ownedScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(ownedPoint.x, ownedPoint.y); await page.mouse.wheel(0, -80);
    await expect(caption(page)).not.toHaveText(narrowed); expect(await page.evaluate(() => scrollY)).toBe(ownedScroll);
    // Observe cancellation after the feature's native listener, using real
    // Chromium wheel delivery. Pass-through is distinct from browser chrome UI.
    await chart(page).evaluate((node) => {
      node.addEventListener("wheel", (event) => { node.setAttribute("data-wheel-prevented", String(event.defaultPrevented)); });
    });
    const beforeModifier = await caption(page).innerText(); const modifiedPoint = await plotPoint(page);
    await page.mouse.move(modifiedPoint.x, modifiedPoint.y);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, -40); await page.keyboard.up("Control");
    await expect(chart(page)).toHaveAttribute("data-wheel-prevented", "false");
    await expect(caption(page)).toHaveText(beforeModifier);
    await mode(page).uncheck(); const offPoint = await plotPoint(page); const offScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(offPoint.x, offPoint.y); await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(offScroll);
    await expect(caption(page)).toHaveText(beforeModifier);
  });
}

test("keyboard focus is visible and isolated; empty gap keeps stable geometry and escape controls", async ({ page }) => {
  await openPage(page, "overview--long-range-zoom"); await expect(chart(page)).toBeVisible();
  await mode(page).focus(); await page.keyboard.press("Space"); await expect(mode(page)).toBeChecked();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  const narrowed = await caption(page).innerText();
  await page.getByRole("combobox", { name: "Inspect observation" }).focus(); await page.keyboard.press("+");
  await expect(caption(page)).toHaveText(narrowed);
  await region(page).focus();
  const outline = await region(page).evaluate((node) => ({ style: getComputedStyle(node).outlineStyle, width: getComputedStyle(node).outlineWidth }));
  expect(outline.style).not.toBe("none"); expect(outline.width).not.toBe("0px");
  await page.keyboard.press("+"); await expect(caption(page)).not.toHaveText(narrowed);
  await page.keyboard.press("-");
  for (let step = 0; step < 20 && await page.getByRole("button", { name: "Zoom in", exact: true }).isEnabled(); step += 1) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await region(page).scrollIntoViewIfNeeded(); const before = await chart(page).boundingBox();
  await region(page).focus(); for (let step = 0; step < 5; step += 1) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("No observations in this chart range")).toBeVisible();
  const inGap = await chart(page).boundingBox(); expect(inGap?.y).toBe(before?.y); expect(inGap?.height).toBe(before?.height);
  await mode(page).uncheck(); await page.getByRole("button", { name: "Reset zoom" }).click();
  await expect(page.getByText("No observations in this chart range")).toHaveCount(0);
  await expect(caption(page)).toHaveText("Visible dates: 2026-01-01 to 2026-12-31");
});

async function swipe(session: CDPSession, page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
  for (let step = 1; step <= 8; step += 1) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + dx * step / 8, y: from.y + dy * step / 8, id: 1 }] });
    await page.evaluate(() => new Promise<void>((resolve) => { requestAnimationFrame(() => { resolve(); }); }));
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("Chromium emulated touch pans horizontally, yields vertical scrolling and keeps touch controls usable", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:6007", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); const session = await context.newCDPSession(page);
  try {
    await openPage(page, "overview--long-range-zoom"); await expect(chart(page)).toBeVisible();
    await mode(page).tap(); for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Zoom in", exact: true }).tap();
    const before = await dates(page); const point = await plotPoint(page); const scroll = await page.evaluate(() => scrollY);
    await swipe(session, page, point, -100, 0);
    await expect.poll(async () => (await dates(page)).start).not.toBe(before.start);
    expect((await dates(page)).days).toBe(before.days); expect(await page.evaluate(() => scrollY)).toBe(scroll);
    const moved = await caption(page).innerText(); const vertical = await plotPoint(page); const y = await page.evaluate(() => scrollY);
    await swipe(session, page, vertical, 0, -140);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y); await expect(caption(page)).toHaveText(moved);
    await mode(page).tap(); const off = await plotPoint(page); const offY = await page.evaluate(() => scrollY);
    await swipe(session, page, off, 0, -100); await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(offY);
    await expect(caption(page)).toHaveText(moved);
    await page.getByRole("button", { name: "Reset zoom" }).tap(); await expect(caption(page)).toHaveText("Visible dates: 2026-01-01 to 2026-12-31");
  } finally { await context.close(); }
});

test("Chromium emulated pinch remains browser-owned without moving chart dates", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:6007", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); const session = await context.newCDPSession(page);
  try {
    await openPage(page, "overview--long-range-zoom"); await expect(chart(page)).toBeVisible(); await mode(page).tap();
    const before = await caption(page).innerText(); const point = await plotPoint(page);
    const scale = await page.evaluate(() => visualViewport?.scale ?? 1);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: point.x - 20, y: point.y, id: 1 }, { x: point.x + 20, y: point.y, id: 2 }] });
    for (let offset = 30; offset <= 90; offset += 10) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - offset, y: point.y, id: 1 }, { x: point.x + offset, y: point.y, id: 2 }] });
      await page.evaluate(() => new Promise<void>((resolve) => { requestAnimationFrame(() => { resolve(); }); }));
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => visualViewport?.scale ?? 1)).toBeGreaterThan(scale);
    await expect(caption(page)).toHaveText(before);
  } finally { await context.close(); }
});
