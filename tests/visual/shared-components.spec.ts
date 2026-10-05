import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.getByRole("note")).toHaveText("Synthetic fixture preview — not live EIA data.");
  await expect(page.locator("#storybook-root")).not.toBeEmpty();
  await page.evaluate(async () => { await document.fonts.ready; });
}

test("M1 maintains label/help/error relations and caller-owned raw date/search values", async ({ page }) => {
  await story(page, "molecules-fields--date-filters");
  const start = page.getByLabel("Start date", { exact: true });
  await start.fill("2026-10-02");
  await expect(start).toHaveValue("2026-10-02");
  await expect(page.getByText("Supplied values: 2026-10-02 to 2026-09-30", { exact: true })).toBeVisible();
  await start.fill("");
  await expect(page.getByText("Supplied values: empty to 2026-09-30", { exact: true })).toBeVisible();
  await story(page, "molecules-fields--compact-range");
  await expect(page.getByRole("group", { name: "Date range" })).toBeVisible();
  await expect(page.getByLabel("Start date", { exact: true })).toHaveValue("2026-09-01");
  await story(page, "molecules-fields--invalid-range");
  await expect(page.getByLabel("Start date", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Start date", { exact: true })).toHaveAccessibleDescription("Synthetic error: choose a different start date.");
  await story(page, "molecules-fields--disabled-range");
  await expect(page.getByLabel("Start date", { exact: true })).toBeDisabled();
  await story(page, "molecules-fields--schema-search");
  const search = page.getByRole("searchbox", { name: "Search datasets" });
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("outline-width", "3px");
  await expect(search).toHaveAccessibleDescription("Enter text to inspect this synthetic control.");
  await search.fill("001A");
  await expect(page.getByText("Supplied search: 001A", { exact: true })).toBeVisible();
  await search.fill("");
  await expect(page.getByText("Supplied search: empty", { exact: true })).toBeVisible();
});

test("M2 explicit pagination actions do not act on render and current page is supplied", async ({ page }) => {
  await story(page, "molecules-paginationcontrols--continuation-actions");
  await expect(page.getByText("No action selected", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Next selected", { exact: true })).toBeVisible();
  await story(page, "molecules-paginationcontrols--numbered-actions");
  await expect(page.getByText("No action selected", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByText("Page 3 selected", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  await story(page, "molecules-paginationcontrols--disabled-actions");
  for (const button of await page.getByRole("button").all()) await expect(button).toBeDisabled();
  await expect(page.getByText("No action selected", { exact: true })).toBeVisible();
});

test("M2 status recovery stays outside announcements and precise values distinguish null/zero", async ({ page }) => {
  await story(page, "molecules-displays--status-states");
  await expect(page.getByRole("alert")).toHaveText("UnavailableYour input has been retained.");
  await expect(page.getByRole("alert").getByRole("button")).toHaveCount(0);
  const recover = page.getByRole("button", { name: "Try again" });
  await recover.focus();
  await expect(recover).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Loading preview" })).toHaveCount(1);
  await story(page, "molecules-displays--precise-values");
  await expect(page.getByText("1.005000", { exact: false })).toBeVisible();
  await expect(page.getByText("0.00", { exact: false })).toBeVisible();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
});

test("O1 preserves duplicate projections, opaque strings, safe source text and keyboard overflow", async ({ page }) => {
  await story(page, "organisms-data-table--duplicate-columns-and-rows");
  const table = page.getByRole("table", { name: "Synthetic duplicate projection" });
  await expect(table.getByRole("columnheader", { name: "value", exact: true })).toHaveCount(2);
  await expect(table.getByRole("row")).toHaveCount(4);
  await expect(table.getByRole("cell", { name: "9007199254740993", exact: true })).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "12345678901234567890.01", exact: true })).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "00A7", exact: true })).toHaveCount(3);
  await expect(table.getByText("<script>synthetic text only</script>", { exact: true })).toBeVisible();
  await expect(table.locator("script")).toHaveCount(0);
  await story(page, "organisms-data-table--typed-values");
  await expect(page.getByRole("cell", { name: "0.00", exact: true })).toBeVisible();
  await expect(page.getByLabel("Missing value", { exact: true })).toHaveCount(1);
  await expect(page.getByText("<em>Text is not HTML</em>", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1100 });
  await story(page, "organisms-data-table--narrow-overflow");
  const region = page.getByRole("region", { name: "Synthetic typed records: scrollable table" });
  expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("T1 sign-in layout exposes supplied entry, pending, expiry and error states without credentials", async ({ page }) => {
  await story(page, "templates-authtemplate--managed-login-entry");
  await expect(page.getByRole("heading", { level: 1, name: "Sign in to your workspace" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Continue to sign in" })).toBeFocused();
  await story(page, "templates-authtemplate--pending");
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Preparing sign-in…" })).toBeDisabled();
  await story(page, "templates-authtemplate--expired");
  await expect(page.getByRole("heading", { name: "Sign in again" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Session expired");
  await story(page, "templates-authtemplate--error");
  await expect(page.getByRole("alert")).toContainText("Sign-in unavailable");
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
});

test("M3 tabs retain keyboard selection and tab/panel associations", async ({ page }) => {
  await story(page, "molecules-navigation--dataset-details");
  const preview = page.getByRole("tab", { name: "Preview" });
  const schema = page.getByRole("tab", { name: "Schema" });
  await page.keyboard.press("Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(schema).toBeFocused();
  await expect(schema).toHaveAttribute("aria-selected", "true");
  const schemaPanel = page.getByRole("tabpanel", { name: "Schema" });
  await expect(schemaPanel).toHaveAttribute("id", await schema.getAttribute("aria-controls") ?? "");
  await expect(schemaPanel).toHaveText("Synthetic schema content.");
  await page.keyboard.press("Home");
  await expect(preview).toBeFocused();
  await page.keyboard.press("End");
  await expect(schema).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(schemaPanel).toBeFocused();
});

test("S1 native modal drawer traps focus, excludes background and restores trigger", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await story(page, "organisms-shell--ready");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Application navigation" });
  const close = dialog.getByRole("button", { name: "Close navigation" });
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.getByRole("button", { name: "Background interaction specimen" }).evaluate((element) => { (element as HTMLButtonElement).focus(); });
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await dialog.getByRole("link", { name: "Dataset Explorer" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/#datasets$/);
});

test("S1 breakpoint transition focuses the active second destination and pending hides destinations", async ({ page }) => {
  await page.setViewportSize({ width: 999, height: 1100 });
  await story(page, "organisms-shell--ready");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Application navigation" });
  await dialog.getByRole("link", { name: "SQL Workspace" }).focus();
  await page.setViewportSize({ width: 1001, height: 1100 });
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Dataset Explorer" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Dataset Explorer" })).toHaveAttribute("aria-current", "page");
  await story(page, "organisms-shell--pending");
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Resolving session…");
});

const specimens = [
  ["fields", "molecules-fields--date-filters"],
  ["compact-range", "molecules-fields--compact-range"],
  ["search", "molecules-fields--schema-search"],
  ["status", "molecules-displays--status-states"],
  ["values", "molecules-displays--precise-values"],
  ["pagination", "molecules-paginationcontrols--continuation-actions"],
  ["numbered-actions", "molecules-paginationcontrols--numbered-actions"],
  ["table", "organisms-data-table--typed-values"],
  ["table-duplicates", "organisms-data-table--duplicate-columns-and-rows"],
  ["auth-entry", "templates-authtemplate--managed-login-entry"],
  ["auth-error", "templates-authtemplate--error"],
  ["tabs", "molecules-navigation--dataset-details"],
  ["shell", "organisms-shell--ready"],
  ["overview-template", "templates-analytical--overview"],
  ["explorer-template", "templates-analytical--explorer"],
  ["workspace-template", "templates-analytical--workspace"],
] as const;

test("shared presentation specimens capture loaded fonts at reference viewports", async ({ page }) => {
  await mkdir("docs/specs/web-client/evidence/phase-3", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(error.message); });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const [name, id] of specimens) {
      await story(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `docs/specs/web-client/evidence/phase-3/${name}-${String(width)}.png`, animations: "disabled" });
    }
  }
  expect(errors).toEqual([]);
});

test("shared layouts retain controls with a 200-percent equivalent reduced viewport", async ({ page }) => {
  // 1440/2 = 720 CSS px models reflow at 200% zoom; this is not browser-zoom certification.
  await page.setViewportSize({ width: 720, height: 550 });
  for (const id of ["molecules-fields--compact-range", "molecules-paginationcontrols--numbered-actions", "organisms-data-table--typed-values", "templates-authtemplate--managed-login-entry", "templates-analytical--explorer", "templates-analytical--workspace", "organisms-shell--ready"]) {
    await story(page, id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("shared fields, table, pagination and sign-in retain content at observed boundaries", async ({ page }) => {
  for (const width of [479, 480, 481, 759, 760, 761, 999, 1000, 1001]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const id of ["molecules-fields--date-filters", "molecules-fields--compact-range", "molecules-paginationcontrols--long-summary", "organisms-data-table--typed-values", "templates-authtemplate--managed-login-entry", "templates-analytical--explorer", "templates-analytical--workspace"]) {
      await story(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});

test("inclusive source breakpoints apply exactly at 480, 760 and 1000 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 1100 });
  await story(page, "molecules-fields--date-filters");
  const start480 = await page.getByLabel("Start date", { exact: true }).boundingBox();
  const end480 = await page.getByLabel("End date", { exact: true }).boundingBox();
  expect(start480).not.toBeNull();
  expect(end480).not.toBeNull();
  expect(end480?.y).toBeGreaterThan(start480?.y ?? 0);
  expect(end480?.x).toBe(start480?.x);
  await story(page, "molecules-paginationcontrols--continuation-actions");
  await expect(page.getByRole("navigation")).toHaveCSS("flex-direction", "column");
  await story(page, "molecules-displays--header");
  await expect(page.getByRole("heading", { name: "Records" }).locator("../..")).toHaveCSS("flex-direction", "column");
  await page.setViewportSize({ width: 481, height: 1100 });
  await story(page, "molecules-fields--date-filters");
  const start481 = await page.getByLabel("Start date", { exact: true }).boundingBox();
  const end481 = await page.getByLabel("End date", { exact: true }).boundingBox();
  expect(end481?.y).toBe(start481?.y);
  expect(end481?.x).toBeGreaterThan(start481?.x ?? 0);

  for (const [id, slot, desktopWidth, gap] of [
    ["templates-analytical--explorer", "Synthetic catalog slot", "275px", "16px"],
    ["templates-analytical--workspace", "Synthetic schema browser slot", "250px", "14px"],
  ] as const) {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await story(page, id);
    const grid = page.getByText(slot, { exact: true }).locator("../..");
    expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ")[0])).toBe(desktopWidth);
    await expect(grid).toHaveCSS("column-gap", gap);
    await expect(page.getByRole("banner")).toHaveCSS("height", "50px");
    await expect(page.getByRole("main")).toHaveCSS("padding-left", "32px");
    await page.setViewportSize({ width: 1000, height: 1100 });
    expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ")[0])).toBe("220px");
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await page.setViewportSize({ width: 760, height: 1100 });
    const first760 = await grid.locator(":scope > div").nth(0).boundingBox();
    const second760 = await grid.locator(":scope > div").nth(1).boundingBox();
    expect(first760).not.toBeNull();
    expect(second760).not.toBeNull();
    expect(second760?.x).toBe(first760?.x);
    expect(second760?.y).toBeGreaterThan(first760?.y ?? 0);
    await expect(page.getByRole("banner")).toHaveCSS("padding-left", "14px");
    await expect(page.getByRole("main")).toHaveCSS("padding-left", "14px");
    await page.setViewportSize({ width: 761, height: 1100 });
    const first761 = await grid.locator(":scope > div").nth(0).boundingBox();
    const second761 = await grid.locator(":scope > div").nth(1).boundingBox();
    expect(second761?.y).toBe(first761?.y);
    expect(second761?.x).toBeGreaterThan(first761?.x ?? 0);
    await page.setViewportSize({ width: 1001, height: 1100 });
    await expect(page.getByRole("complementary", { name: "Application navigation" })).toHaveCSS("width", "232px");
    await expect(page.getByRole("button", { name: "Open navigation" })).not.toBeVisible();
  }
  await story(page, "templates-analytical--pending");
  await expect(page.getByText("Protected child specimen must remain unmounted.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Protected accessory", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Resolving session…");
});
