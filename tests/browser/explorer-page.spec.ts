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
