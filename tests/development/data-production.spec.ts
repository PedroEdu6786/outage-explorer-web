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
for (const pendingQuery of [false, true]) {
  test(`current denial clears off-route SQL until explicit session recovery (pending: ${String(pendingQuery)})`, async ({ page }) => {
    const expiry = new Date(Date.now() + 600_000).toISOString();
    let sessionReads = 0;
    let queryPosts = 0;
    let queryStarted = false;
    let releaseQuery = () => { /* Immediate responses require no release. */ };
    const delayedQuery = new Promise<void>((resolve) => { releaseQuery = resolve; });
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === "/api/auth/session") {
        sessionReads += 1;
        return route.fulfill({ json: { user: { id: "controlled-user", email: "controlled@example.invalid", role: "analyst" }, expires_at: expiry, csrf_token: "controlled-csrf" } });
      }
      if (path === "/api/datasets") return route.fulfill({ json: body("catalog_analyst") });
      if (path === "/api/datasets/national/preview" && sessionReads > 1) {
        return route.fulfill({ json: { ...body("preview_national"), page_size: 100, has_more: false, next_cursor: null, expires_at: expiry } });
      }
      if (path === "/api/query" && request.method() === "POST") {
        queryPosts += 1;
        queryStarted = true;
        if (pendingQuery) await delayedQuery;
        return route.fulfill({ json: { ...body("query_reference_free"), expires_at: expiry } });
      }
      return route.fulfill({ status: 403, json: { error: "forbidden" } });
    });
    await page.goto("/query");
    await page.getByRole("textbox", { name: "SQL statement" }).fill("SELECT 1");
    await page.getByLabel("Rows per page for next execution", { exact: true }).fill("1");
    await page.getByRole("button", { name: "Run query", exact: true }).click();
    await expect.poll(() => queryStarted).toBe(true);
    if (!pendingQuery) await expect(page.getByRole("table", { name: "SQL query results" })).toBeVisible();
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access denied", exact: true })).toBeVisible();
    releaseQuery();
    await expect(page.getByRole("table", { includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main navigation", includeHidden: true })).toHaveCount(0);
    expect(sessionReads).toBe(1);
    await page.getByRole("button", { name: "Check session", exact: true }).click();
    await page.getByRole("link", { name: "SQL Workspace", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "SQL statement" })).toHaveValue("");
    await expect(page.getByRole("table", { name: "SQL query results" })).toHaveCount(0);
    expect(queryPosts).toBe(1);
    expect(sessionReads).toBe(2);
  });
}
for (const role of ["viewer", "analyst", "admin"] as const) {
  test(`${role} production registration, handoffs and retained SQL`, async ({ page }) => {
    await page.clock.install();
    const errors: string[] = []; const posts: { url: string; sql: string | null; csrf: string | undefined }[] = [];
    let catalogReads = 0;
    const reads: string[] = []; const expiry = new Date(Date.now() + 600_000).toISOString();
    const queryExpiry = new Date(Date.now() + 300_000).toISOString();
    page.on("pageerror", (error) => { errors.push(error.message); });
    // Catch every API request. No test request falls through to a real backend.
    await page.route("**/api/**", (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === "/api/auth/session") return route.fulfill({ status: 200, json: {
        user: { id: "controlled-user", email: "controlled@example.invalid", role }, expires_at: expiry, csrf_token: "controlled-csrf",
      } });
      if (url.pathname === "/api/datasets") { catalogReads++; return route.fulfill({ status: 200, json: body(`catalog_${role}`) }); }
      if (url.pathname === "/api/datasets/national/preview") {
        reads.push(url.search);
        expect(["10", "100"]).toContain(url.searchParams.get("page_size"));
        return route.fulfill({ status: 200, json: { ...body("preview_national"), page_size: Number(url.searchParams.get("page_size")), expires_at: expiry } });
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
    expect(catalogReads).toBe(1);
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

test("both tables start at ten rows, resize and paginate without changing the Overview series", async ({ page }) => {
  const expiry = new Date(Date.now() + 600_000).toISOString();
  const preview = body("preview_national");
  const first = (preview.rows as string[][])[0];
  if (!first) throw new Error("Synthetic national row required");
  const rows = Array.from({ length: 23 }, (_, index) => [
    `2026-09-${String(23 - index).padStart(2, "0")}`, ...first.slice(1),
  ]);
  const reads: URL[] = [];
  const errors: string[] = [];
  let releaseRange: (() => void) | undefined;
  const heldRange = new Promise<void>((resolve) => { releaseRange = resolve; });
  page.on("pageerror", (error) => { errors.push(error.message); });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/session") return route.fulfill({ status: 200, json: {
      user: { id: "controlled-user", email: "controlled@example.invalid", role: "analyst" }, expires_at: expiry, csrf_token: "controlled-csrf",
    } });
    if (url.pathname === "/api/datasets") {
      const catalog = body("catalog_analyst");
      const datasets = catalog.datasets as { coverage: { start_date: string; end_date: string } }[];
      for (const dataset of datasets) dataset.coverage = { start_date: "2026-09-01", end_date: "2026-09-23" };
      return route.fulfill({ status: 200, json: catalog });
    }
    if (url.pathname === "/api/datasets/national/preview") {
      reads.push(url);
      const cursor = url.searchParams.get("cursor");
      if (cursor) expect([...url.searchParams.keys()]).toEqual(["cursor"]);
      const [size, offset] = cursor ? cursor.split(":").map(Number) : [Number(url.searchParams.get("page_size")), 0];
      if (!size || offset === undefined) throw new Error("Invalid controlled page request");
      const end = offset + size;
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");
      const filtered = rows.filter(([date]) => date !== undefined && (!startDate || date >= startDate) && (!endDate || date <= endDate));
      if (endDate === "2026-09-05") await heldRange;
      return route.fulfill({ status: 200, json: {
        ...preview, rows: filtered.slice(offset, end), page_size: size,
        page_cursor: `${String(size)}:${String(offset)}`,
        next_cursor: end < filtered.length ? `${String(size)}:${String(end)}` : null,
        has_more: end < filtered.length, expires_at: expiry,
      } });
    }
    return route.fulfill({ status: 503, json: { error: "service_unavailable" } });
  });
  await page.goto("/overview");
  const daily = page.getByRole("table", { name: "Daily national observations" });
  await expect(daily.getByRole("row")).toHaveCount(11);
  await expect(page.getByLabel("Rows per page", { exact: true })).toHaveValue("10");
  const chart = page.locator("svg[data-chart=national-trend]");
  await expect(chart.locator("circle")).toHaveCount(23);
  const requestsAfterSeries = reads.length;
  const dailyPages = page.getByRole("navigation", { name: "Daily observations pagination" });
  await dailyPages.getByRole("button", { name: "Next", exact: true }).click();
  await expect(daily.getByRole("cell", { name: "2026-09-11", exact: true })).toBeVisible();
  await dailyPages.getByRole("button", { name: "Next", exact: true }).click();
  await expect(daily.getByRole("row")).toHaveCount(4);
  await expect(dailyPages.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByLabel("Rows per page", { exact: true }).selectOption("20");
  await expect(daily.getByRole("row")).toHaveCount(21);
  await expect(dailyPages.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await expect(chart.locator("circle")).toHaveCount(23);
  expect(reads).toHaveLength(requestsAfterSeries);

  // Requested dates immediately constrain the consumed chart data while HTTP is held.
  await page.getByLabel("End date", { exact: true }).fill("2026-09-07");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-05");
  await expect(daily).toBeVisible();
  expect(reads).toHaveLength(requestsAfterSeries);
  await page.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(chart.locator("g[data-series=calculated] circle")).toHaveCount(5);
  await expect(chart.locator("text").last()).toHaveText("2026-09-05");
  await expect(chart.locator("xpath=ancestor::*[@inert]")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("status")).toContainText("Loading national observations");
  expect(reads.at(-1)?.searchParams.get("end_date")).toBe("2026-09-05");
  releaseRange?.();
  await expect(daily.getByRole("row")).toHaveCount(6);
  await expect(chart.locator("g[data-series=calculated] circle")).toHaveCount(5);
  await page.getByLabel("End date", { exact: true }).fill("2026-09-23");
  await page.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(chart.locator("g[data-series=calculated] circle")).toHaveCount(23);
  await expect(page.getByRole("button", { name: "Explore dataset", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Explore dataset", exact: true }).click();
  await expect(page).toHaveURL(/\/datasets$/);
  const explorer = page.getByRole("table");
  await expect(explorer.getByRole("row")).toHaveCount(11);
  await expect(page.getByLabel("Rows per page", { exact: true })).toHaveValue("10");
  const previewPages = page.getByRole("navigation", { name: "Preview continuation" });
  await previewPages.getByRole("button", { name: "Next", exact: true }).click();
  await expect(explorer.getByRole("cell", { name: "2026-09-13", exact: true })).toBeVisible();
  await previewPages.getByRole("button", { name: "Next", exact: true }).click();
  await expect(explorer.getByRole("row")).toHaveCount(4);
  await expect(previewPages.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await previewPages.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(explorer.getByRole("cell", { name: "2026-09-13", exact: true })).toBeVisible();
  await page.getByLabel("Rows per page", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(explorer.getByRole("row")).toHaveCount(21);
  await expect(previewPages.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  expect(reads.at(-1)?.searchParams.get("page_size")).toBe("20");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Rows per page", { exact: true })).toBeVisible();
  await previewPages.getByRole("button", { name: "Next", exact: true }).click();
  await expect(explorer.getByRole("row")).toHaveCount(4);
  expect(errors).toEqual([]);
});
