import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.getByRole("note")).toHaveText("Synthetic fixture preview — not live EIA data.");
  await expect(page.locator("#storybook-root")).not.toBeEmpty();
  await page.evaluate(async () => { await document.fonts.ready; });
}

test("A1 actions retain keyboard focus, disabled/loading and native links", async ({ page }) => {
  await story(page, "atoms-actions--vocabulary");
  const primary = page.getByRole("button", { name: "Apply filters" });
  await page.keyboard.press("Tab");
  await expect(primary).toBeFocused();
  await expect(primary).toHaveCSS("outline-style", "solid");
  await expect(primary).toHaveCSS("outline-width", "3px");
  await expect(primary).toHaveCSS("outline-color", "rgb(8, 125, 130)");
  await expect(primary).toHaveCSS("background-color", "rgb(8, 125, 130)");
  await expect(primary).toHaveCSS("font-size", "11px");
  await expect(primary).toHaveCSS("font-weight", "600");
  await expect(primary).toHaveCSS("border-radius", "5px");
  await expect(primary).toHaveCSS("min-height", "32px");
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Signing in…" })).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reset" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close preview" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Explore dataset" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#action-destination$/);
});

test("A2 native keyboard search, select, checkbox and unchanged code editing", async ({ page }) => {
  await story(page, "atoms-controls--schema-search");
  const search = page.getByRole("searchbox", { name: "Search datasets" });
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await page.keyboard.type("synthetic");
  await expect(search).toHaveValue("synthetic");
  await expect(search).toHaveAccessibleDescription("Enter text to inspect the native search field.");
  await story(page, "atoms-controls--filter-select");
  const select = page.getByRole("combobox", { name: "Filter option" });
  await select.focus();
  await expect(select).toBeFocused();
  // Native typeahead avoids macOS headless popup-menu ArrowDown behavior.
  await page.keyboard.press("s");
  await expect(select).toHaveValue("a");
  await story(page, "atoms-controls--compare-checkbox");
  const checkbox = page.getByRole("checkbox", { name: "Compare reported percentage" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.getByText("Compare reported percentage", { exact: true }).click();
  await expect(checkbox).toBeChecked();
  await story(page, "atoms-controls--code-entry");
  const code = page.getByRole("textbox", { name: "Query" });
  await code.fill("SELECT\n  '001A';");
  await expect(code).toHaveValue("SELECT\n  '001A';");
  await expect(code).toHaveCSS("font-family", '"JetBrains Mono", monospace');
  await expect(code).toHaveCSS("outline-style", "solid");
});

test("A3 status semantics and reduced-motion ring retain exact token styles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await story(page, "atoms-status-and-surfaces--loading");
  const status = page.getByRole("status");
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("Loading preview");
  await expect(status.locator("span[aria-hidden=true]")).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(status.locator("span[aria-hidden=true]")).toHaveCSS("animation-duration", "0.8s");
  await story(page, "atoms-status-and-surfaces--tones");
  await expect(page.getByText("Sample data", { exact: true })).toHaveCSS("color", "rgb(87, 105, 115)");
  const badge = page.getByText("Read only", { exact: true });
  await expect(badge).toHaveCSS("font-size", "9px");
  await expect(badge).toHaveCSS("font-weight", "650");
  await expect(badge).toHaveCSS("color", "rgb(36, 119, 79)");
  await expect(badge).toHaveCSS("background-color", "rgb(232, 245, 238)");
  await story(page, "atoms-status-and-surfaces--panel");
  await expect(page.getByRole("region", { name: "Preview panel" })).toHaveCSS("border-radius", "8px");
  await expect(page.getByRole("heading", { name: "Preview panel" })).toHaveCSS("font-weight", "650");
});

test("A1–A3 specimens capture loaded local fonts at both reference viewports", async ({ page }) => {
  await mkdir("docs/specs/web-client/evidence/phase-2", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const specimens = [
    ["actions", "atoms-actions--vocabulary"],
    ["controls", "atoms-controls--date-filters"],
    ["code", "atoms-controls--code-entry"],
    ["badges", "atoms-status-and-surfaces--tones"],
    ["surface", "atoms-status-and-surfaces--panel"],
    ["brand", "atoms-brand--wordmark"],
    ["icons", "atoms-brand--icons"],
  ] as const;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const [name, id] of specimens) {
      await story(page, id);
      await page.screenshot({ path: `docs/specs/web-client/evidence/phase-2/${name}-${String(width)}.png`, animations: "disabled" });
    }
  }
  await story(page, "atoms-status-and-surfaces--panel");
  const fontEvidence = await page.evaluate(async () => {
    await document.fonts.load('650 16px Inter', "Preview panel");
    await document.fonts.load('400 11px "JetBrains Mono"');
    await document.fonts.load('500 11px "JetBrains Mono"');
    return [...document.fonts].filter((font) => ["Inter", "JetBrains Mono"].includes(font.family)).map((font) => ({ family: font.family, weight: font.weight, status: font.status }));
  });
  expect(fontEvidence).toEqual(expect.arrayContaining([
    { family: "Inter", weight: "100 900", status: "loaded" },
    { family: "JetBrains Mono", weight: "400", status: "loaded" },
    { family: "JetBrains Mono", weight: "500", status: "loaded" },
  ]));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#surface-title" });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  expect(fonts.some((font) => font.isCustomFont && font.familyName === "Inter Variable" && font.postScriptName.includes("wght28A0000"))).toBe(true);
  expect(errors).toEqual([]);
});

test("atomic specimens retain content across recorded breakpoint boundary widths", async ({ page }) => {
  for (const width of [479, 480, 481, 759, 760, 761, 999, 1000, 1001]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const id of ["atoms-actions--vocabulary", "atoms-controls--date-filters", "atoms-controls--code-entry", "atoms-brand--icons"]) {
      await story(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});
