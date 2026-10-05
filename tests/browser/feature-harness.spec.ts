import { expect, test, type Page } from "@playwright/test";

interface Call { readonly operation: string; readonly input: unknown; readonly outcome: string }
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
async function trace(page: Page): Promise<readonly Call[]> {
  await button(page, "Inspect synthetic calls").click();
  return JSON.parse(await page.getByTestId("call-trace").innerText()) as readonly Call[];
}
test.beforeEach(async ({ page }) => {
  await page.goto("/iframe.html?id=integration-feature-harness--shared-session&viewMode=story");
  await expect(page.locator('[data-fixture-root="synthetic-only"]').getByRole("note")).toContainText("Synthetic fixture integration demo");
  await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
});

test("composed handoffs preserve dates, require edited-draft consent and never execute until Run", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => { errors.push(error.message); });
  await page.getByRole("region", { name: "Overview feature" }).getByLabel("End date", { exact: true }).fill("2026-09-03");
  await button(page, "Explore dataset").click();
  await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Explorer feature" }).getByLabel("End date", { exact: true })).toHaveValue("2026-09-03");
  await button(page, "SQL view").click();
  const editor = page.getByRole("textbox", { name: "SQL statement" });
  await editor.fill("SELECT 'edited unsent draft'");
  await button(page, "Explorer view").click(); await button(page, "Open in SQL Workspace").click();
  await expect(page.getByText("Replace edited draft?", { exact: true })).toBeVisible();
  await expect(editor).toHaveValue("SELECT 'edited unsent draft'");
  expect((await trace(page)).filter((call) => call.operation === "executeQuery")).toHaveLength(0);
  await button(page, "Replace draft").click(); await expect(editor).toHaveValue("SELECT * FROM synthetic_national");
  const handoff = (await trace(page)).filter((call) => call.operation === "consumeNavigationIntent").at(-1);
  expect(handoff?.input).toMatchObject({ datasetId: "synthetic-national", filters: { dates: { end: "2026-09-03" } } });
  const sql = "SELECT * FROM synthetic_national;\n";
  await editor.fill(sql); await expect(editor).toHaveValue(sql); await editor.press("Control+Enter");
  await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await editor.fill("SELECT 'unsent revision'");
  await page.getByLabel("Rows per page for next execution").fill("3");
  await button(page, "Next").click(); await expect(page.getByText("Page 2 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
  await button(page, "Previous").click(); await expect(page.getByText("Page 1 of 2 · Fixed 2 rows per page", { exact: true })).toBeVisible();
  await page.evaluate(() => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
  const calls = await trace(page);
  expect(calls.filter((call) => call.operation === "executeQuery").map((call) => call.input)).toEqual([{ sql, page: 1, pageSize: 2 }]);
  expect(calls.filter((call) => call.operation === "readQueryPage").map((call) => call.input)).toEqual([2, 1].map((page) => ({ queryId: "synthetic-query-1", page, pageSize: 2 })));
  expect(errors).toEqual([]);
});

for (const outcome of ["success", "stale-denial"] as const) {
  test(`delayed ${outcome} cannot restore Analyst metadata/results after logout and Viewer resolution`, async ({ page }) => {
    await button(page, "Explorer view").click();
    await button(page, "Delay next schema").click(); await button(page, "Delay next preview").click();
    if (outcome === "stale-denial") {
      await button(page, "Fail next schema as unauthenticated").click();
      await button(page, "Fail next preview as forbidden").click();
    }
    await page.getByRole("button", { name: /Synthetic facility observations/ }).click();
    await button(page, "Open in SQL Workspace").click();
    await button(page, "Delay next execution").click(); await button(page, "Run query").click();
    await expect(page.getByText("Executing query", { exact: true })).toBeVisible();
    await button(page, "Sign out").click();
    await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
    await expect(page.locator('[data-fixture-root="synthetic-only"]').getByRole("table", { includeHidden: true })).toHaveCount(0);
    await button(page, "Resolve synthetic Viewer").click();
    await button(page, "Release delayed responses").click();
    await button(page, "Explorer view").click();
    await expect(page.getByRole("table", { name: "Synthetic national observations preview" })).toBeVisible();
    await expect(page.getByText("Synthetic facility observations", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Facility", { exact: true })).toHaveCount(0);
    await button(page, "SQL view").click();
    await expect(page.getByRole("textbox", { name: "SQL statement" })).toHaveCount(0);
  await expect(page.getByText("Query access denied", { exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(button(page, "synthetic_facility")).toHaveCount(0);
    await expect(button(page, "synthetic_national")).toHaveCount(0);
    await expect(page.getByText("Dataset context prepared", { exact: true })).toHaveCount(0);
    const calls = await trace(page);
    expect(calls.filter((call) => ["readSchema", "startPreview", "executeQuery"].includes(call.operation) && call.outcome === "pending")).toHaveLength(0);
    expect(calls.filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  });
}

test("access reduction removes pending consent and unresolved identity withholds all protected features", async ({ page }) => {
  await button(page, "SQL view").click(); await page.getByRole("textbox", { name: "SQL statement" }).fill("SELECT 'edited'");
  await button(page, "Run query").click(); await expect(page.getByText("Query succeeded", { exact: true })).toBeVisible();
  await button(page, "Explorer view").click(); await page.getByRole("button", { name: /Synthetic facility observations/ }).click();
  await button(page, "Open in SQL Workspace").click(); await expect(page.getByText("Replace edited draft?", { exact: true })).toBeVisible();
  await button(page, "Resolve synthetic Viewer").click();
  await expect(page.getByText("Replace edited draft?", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "SQL statement" })).toHaveCount(0);
  await expect(page.getByText("Query access denied", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await button(page, "Withhold unresolved session").click();
  await expect(page.locator('[data-fixture-root="synthetic-only"]').getByRole("table", { includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "SQL statement", includeHidden: true })).toHaveCount(0);
});
