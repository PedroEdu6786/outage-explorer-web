import { test, expect } from "@playwright/test";
import { calls, openPage } from "./support/page-boundary";
test("Explorer page prepares authorized Analyst SQL", async ({ page }) => {
  await openPage(page, "explorer--ready");
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await expect(page.getByLabel("Facility", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Schema", exact: true }).click();
  await expect(page.getByRole("table", { name: "Authorized dataset schema" })).toBeVisible();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Open in SQL Workspace", exact: true }).click();
  await expect(page.getByTestId("route-path")).toHaveText("/query");
  await expect(page.getByRole("textbox", { name: "SQL statement" })).toHaveValue("SELECT * FROM synthetic_national");
  expect((await calls(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(0);
});
test("preview cursor expiry requires deliberate restart", async ({ page }) => {
  await openPage(page, "explorer--ready");
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await page.getByRole("button", { name: "Expire next cursor" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Preview expired", { exact: true })).toBeVisible();
  const before = (await calls(page)).filter((call) => call.operation === "startPreview").length;
  await page.getByRole("button", { name: /Restart/ }).click();
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  expect((await calls(page)).filter((call) => call.operation === "startPreview")).toHaveLength(before + 1);
});

test("Viewer direct Explorer entry returns to Overview without preview or SQL access", async ({ page }) => {
  await openPage(page, "explorer--viewer");
  await expect(page.getByTestId("route-path")).toHaveText("/overview");
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dataset Explorer", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "SQL Workspace", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore dataset", exact: true })).toHaveCount(0);
  expect((await calls(page)).filter((call) => ["startPreview", "readSchema", "executeQuery"].includes(call.operation))).toHaveLength(0);
});


test("motion-on pending Explorer paging clears rows and schema synchronously when session is withheld", async ({ page }) => {
  await openPage(page, "explorer--ready", "motion:on");
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await page.getByRole("tab", { name: "Schema", exact: true }).click();
  await expect(page.getByRole("table", { name: "Authorized dataset schema" })).toBeVisible();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  const cleared = await page.evaluate(() => {
    const click = (label: string) => { const button = Array.from(document.querySelectorAll("button")).find((element) => element.textContent.trim() === label); if (!button) throw new Error(label); button.click(); };
    click("Next"); click("Withhold unresolved session");
    return new Promise<boolean>((resolve) => { requestAnimationFrame(() => { resolve(document.querySelector("#storybook-root table") === null && document.querySelector("[inert]") === null); }); });
  });
  expect(cleared).toBe(true);
  await expect(page.locator("#storybook-root").getByRole("table", { includeHidden: true })).toHaveCount(0);
  await expect(page.getByText("Synthetic facility observations", { exact: true })).toHaveCount(0);
});

test("Facilities applies exact ID with dates, clears it, and shows unmatched IDs as empty", async ({ page }) => {
  await openPage(page, "explorer--ready");
  await page.getByRole("button", { name: /Synthetic facility observations/ }).click();
  await expect(page.getByRole("table", { name: "Synthetic facility observations preview" })).toBeVisible();
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-01");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-30");
  await page.getByLabel("Facility ID (optional)", { exact: true }).fill("0012");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("table", { name: "Synthetic facility observations preview" })).toBeVisible();
  expect((await calls(page)).filter((call) => call.operation === "startPreview").at(-1)?.input).toMatchObject({ filters: { facilityId: "0012", dates: { start: "2026-09-01", end: "2026-09-30" } } });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeEnabled();
  await page.getByLabel("Facility ID (optional)", { exact: true }).fill("UnmatchedID");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByText("No records match these filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await page.getByLabel("Facility ID (optional)", { exact: true }).fill("");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("table", { name: "Synthetic facility observations preview" })).toBeVisible();
  expect((await calls(page)).filter((call) => call.operation === "startPreview").at(-1)?.input).toMatchObject({ filters: { dates: { start: "2026-09-01", end: "2026-09-30" } } });
  expect((await calls(page)).filter((call) => call.operation === "startPreview").at(-1)?.input).not.toHaveProperty("filters.facilityId");
});
