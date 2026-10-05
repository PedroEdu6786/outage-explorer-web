import { expect, test } from "@playwright/test";
import fixtures from "../../docs/specs/web-client/contracts/data-api-v1/fixtures.json" with { type: "json" };

// Controlled synthetic HTTP on actual production routes; never live acceptance.
function body(name: string): Record<string, unknown> {
  const fixture = fixtures.fixtures.find((item) => item.name === name);
  if (!fixture) throw new Error("Missing controlled response");
  return structuredClone(fixture.body);
}
function queryBody(name: string) {
  // Explicit uncommon-value injection, isolated to this controlled test root.
  return { ...body(name), columns: [
    { index: 0, name: "x", type: "integer", encoding: "integer-string", nullable: null, unit: null },
    { index: 1, name: "untrusted_text", type: "string", encoding: "string", nullable: null, unit: null },
  ], rows: [[name === "query_second" ? "-9007199254740993" : "9007199254740993", '<img src=x onerror="alert(1)">']] };
}
for (const role of ["viewer", "analyst", "admin"] as const) {
  test(`${role} production registration, handoffs and retained SQL`, async ({ page }) => {
    await page.clock.install();
    const errors: string[] = []; const posts: { url: string; sql: string | null; csrf: string | undefined }[] = [];
    const reads: string[] = []; const expiry = new Date(Date.now() + 600_000).toISOString();
    const queryExpiry = new Date(Date.now() + 300_000).toISOString();
    page.on("pageerror", (error) => { errors.push(error.message); });
    // Catch every API request. No test request falls through to a real backend.
    await page.route("**/api/**", (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === "/api/auth/session") return route.fulfill({ status: 200, json: {
        user: { id: "controlled-user", email: "controlled@example.invalid", role }, expires_at: expiry, csrf_token: "controlled-csrf",
      } });
      if (url.pathname === "/api/datasets") return route.fulfill({ status: 200, json: body(`catalog_${role}`) });
      if (url.pathname === "/api/datasets/national/preview") {
        reads.push(url.search);
        expect(url.searchParams.get("page_size")).toBe("100");
        return route.fulfill({ status: 200, json: { ...body("preview_national"), expires_at: expiry } });
      }
      if (url.pathname === "/api/query" && request.method() === "POST") {
        posts.push({ url: url.search, sql: request.postData(), csrf: request.headers()["x-csrf-token"] });
        return route.fulfill({ status: 200, json: { ...queryBody("query_reference_free"), expires_at: queryExpiry } });
      }
      if (url.pathname === "/api/query" && request.method() === "GET") {
        expect([...url.searchParams.keys()].sort()).toEqual(["page", "page_size", "query_id"]);
        expect(url.searchParams.get("page_size")).toBe("1");
        expect(url.searchParams.get("query_id")).toBe("query-synthetic-1");
        return route.fulfill({ status: 200, json: { ...queryBody(url.searchParams.get("page") === "2" ? "query_second" : "query_reference_free"), generation_id: null, expires_at: queryExpiry } });
      }
      return route.fulfill({ status: 503, json: { error: "service_unavailable" } });
    });
    await page.goto("/overview");
    await expect(page.getByRole("table", { name: "Daily national observations" })).toBeVisible();
    await expect(page.locator("[data-fixture-root]")).toHaveCount(0);
    expect(reads.length).toBeGreaterThan(0); expect(posts).toHaveLength(0);
    if (role === "viewer") {
      for (const path of ["/datasets", "/query"]) {
        await page.goto(path); await expect(page).toHaveURL(/\/overview$/);
        await expect(page.getByRole("textbox", { name: "SQL statement", includeHidden: true })).toHaveCount(0);
      }
      expect(posts).toHaveLength(0); expect(errors).toEqual([]); return;
    }
    await page.getByRole("button", { name: "Explore dataset", exact: true }).click();
    await expect(page).toHaveURL(/\/datasets$/);
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: "Open in SQL Workspace", exact: true }).click();
    await expect(page).toHaveURL(/\/query$/);
    const editor = page.getByRole("textbox", { name: "SQL statement" });
    await expect(editor).toHaveValue("SELECT * FROM national");
    await expect(page.getByLabel("Rows per page for next execution")).toHaveValue("100");
    expect(posts).toHaveLength(0);
    const sql = " SELECT 1\n";
    await editor.fill(sql); await page.getByLabel("Rows per page for next execution").fill("1");
    await page.getByRole("button", { name: "Run query", exact: true }).click();
    await expect(page.getByText(/Reference-free execution · 2 retained rows/)).toBeVisible();
    await expect(page.getByText("9007199254740993", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: '<img src=x onerror="alert(1)">', exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Retained query results", exact: true }).locator("img, script")).toHaveCount(0);
    await editor.fill("SELECT 'edited unsent'");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("-9007199254740993", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Dataset Explorer", exact: true }).click();
    await page.getByRole("button", { name: "Open in SQL Workspace", exact: true }).click();
    await expect(page.getByText("Replace edited draft?", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Keep draft", exact: true }).click();
    await expect(editor).toHaveValue("SELECT 'edited unsent'");
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await page.getByRole("link", { name: "SQL Workspace", exact: true }).click();
    await expect(editor).toHaveValue("SELECT 'edited unsent'");
    await page.evaluate(() => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
    await page.clock.fastForward(300_100);
    await expect(page.getByText("Results expired", { exact: true })).toBeVisible();
    await expect(page.getByRole("table", { name: "SQL query results" })).toHaveCount(0);
    await expect(editor).toHaveValue("SELECT 'edited unsent'");
    expect(posts).toEqual([{ url: "?page=1&page_size=1", sql: JSON.stringify({ sql }), csrf: "controlled-csrf" }]);
    expect(errors).toEqual([]);
  });
}

test("configured production backend failures stay explicit without fallback or SQL replay", async ({ page }) => {
  let posts = 0;
  await page.route("**/api/**", (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/api/auth/session") return route.fulfill({ status: 200, json: {
      user: { id: "controlled-failure-user", email: "failure@example.invalid", role: "analyst" }, expires_at: new Date(Date.now() + 600_000).toISOString(), csrf_token: "controlled-failure-csrf",
    } });
    if (request.method() === "POST") posts++;
    return route.fulfill({ status: 503, json: { error: "service_unavailable" } });
  });
  for (const path of ["/overview", "/datasets", "/query"]) {
    await page.goto(path);
    await expect(page.getByText("The service is unavailable. Try again deliberately.", { exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("[data-fixture-root]")).toHaveCount(0);
  }
  await page.getByRole("textbox", { name: "SQL statement" }).fill("SELECT 1");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByText("Execution outcome unknown", { exact: true })).toBeVisible();
  await page.evaluate(() => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.getByRole("link", { name: "SQL Workspace", exact: true }).click();
  await expect(page.getByRole("table")).toHaveCount(0);
  expect(posts).toBe(1);
});
