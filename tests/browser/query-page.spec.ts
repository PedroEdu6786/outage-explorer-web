import { test, expect } from "@playwright/test";
import { calls, navigate, openPage } from "./support/page-boundary";
test("SQL page retains one execution and edited draft across real page compositions", async ({ page }) => {
  await openPage(page, "query--ready");
  const editor = page.getByRole("textbox", { name: "SQL statement" });
  const sql = "SELECT * FROM synthetic_national;\n";
  await editor.fill(sql); await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await editor.fill("SELECT 'unsent revision'");
  await page.getByLabel("Rows per page for next execution").fill("3");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.evaluate(() => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
  await navigate(page, "Dataset Explorer");
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await page.getByRole("button", { name: "Open in SQL Workspace", exact: true }).click();
  await expect(page.getByText("Replace edited draft?", { exact: true })).toBeVisible();
  await expect(editor).toHaveValue("SELECT 'unsent revision'");
  await page.getByRole("button", { name: "Keep draft", exact: true }).click();
  await expect(editor).toHaveValue("SELECT 'unsent revision'");
  await navigate(page, "Overview");
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
  await navigate(page, "SQL Workspace");
  await expect(editor).toHaveValue("SELECT 'unsent revision'");
  await expect(page.getByText("Page 1 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
  await expect(page.getByText("Replace edited draft?", { exact: true })).toHaveCount(0);
  const trace = await calls(page);
  expect(trace.filter((call) => call.operation === "executeQuery").map((call) => call.input)).toEqual([{ sql, page: 1, pageSize: 2 }]);
  expect(trace.filter((call) => call.operation === "readQueryPage").map((call) => call.input)).toEqual([2, 1].map((page) => ({ queryId: "synthetic-query-1", page, pageSize: 2 })));
});
test("busy and lost results offer explicit recovery without rerun", async ({ page }) => {
  await openPage(page, "query--ready");
  const editor = page.getByRole("textbox", { name: "SQL statement" });
  await editor.fill("SELECT 1"); await page.getByRole("button", { name: "Make next Run busy" }).click();
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByText("Query engine busy", { exact: true })).toBeVisible();
  expect((await calls(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lose SQL results" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Results lost", { exact: true })).toBeVisible();
  await expect(editor).toHaveValue("SELECT 1");
  expect((await calls(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(2);
});


test("motion-on SQL paging and expanded schema clear at once when session is withheld", async ({ page }) => {
  await openPage(page, "query--ready", "motion:on");
  await page.getByRole("textbox", { name: "SQL statement" }).fill("SELECT * FROM synthetic_national");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "synthetic_national", exact: true }).click();
  await expect(page.getByText("Schema labels are a reference; no SQL is inserted or run.")).toBeVisible();
  const cleared = await page.evaluate(() => {
    const click = (label: string) => { const button = Array.from(document.querySelectorAll("button")).find((element) => element.textContent.trim() === label); if (!button) throw new Error(label); button.click(); };
    click("Next"); click("Withhold unresolved session");
    return new Promise<boolean>((resolve) => { requestAnimationFrame(() => { resolve(document.querySelector("#storybook-root table") === null && document.querySelector(".animate-expand") === null && document.querySelector("[inert]") === null); }); });
  });
  expect(cleared).toBe(true);
  await expect(page.locator("#storybook-root").getByRole("table", { includeHidden: true })).toHaveCount(0);
  await expect(page.getByText("Schema labels are a reference; no SQL is inserted or run.")).toHaveCount(0);
});
