import { test, expect } from "@playwright/test";

const receipt = { run_id: "synthetic-refresh-run", status: "accepted", effective_interval: { start_date: "2026-04-02", end_date: "2026-10-01" }, status_url: "/api/refresh/synthetic-refresh-run" };
for (const role of ["viewer", "analyst", "admin"] as const) {
  test(`${role} Overview refresh visibility and transport`, async ({ page }) => {
    const posts: { key: string | undefined; body: string | null; csrf: string | undefined }[] = [];
    const reads: string[] = [];
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      user: { id: "synthetic-refresh-user", email: "refresh@example.invalid", role }, expires_at: new Date(Date.now() + 600_000).toISOString(), csrf_token: "synthetic-refresh-csrf",
    }) }));
    await page.route("**/api/refresh{,/**}", (route) => {
      if (route.request().method() === "POST") {
        const headers = route.request().headers();
        posts.push({ key: headers["idempotency-key"], body: route.request().postData(), csrf: headers["x-csrf-token"] });
        // First admission is uncertain. A deliberate retry must keep the key.
        return route.fulfill({ status: posts.length === 1 ? 503 : 202, contentType: "application/json", body: JSON.stringify(posts.length === 1 ? { error: "synthetic unavailable" } : receipt) });
      }
      reads.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...receipt, status: "succeeded", stage: "finished" }) });
    });
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
    const refresh = page.getByRole("button", { name: "Refresh data", exact: true });
    if (role !== "admin") {
      await expect(refresh).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Check refresh status", exact: true })).toHaveCount(0);
      expect(posts).toHaveLength(0); expect(reads).toHaveLength(0); return;
    }
    await expect(refresh).toBeEnabled(); expect(posts).toHaveLength(0);
    await refresh.click();
    await expect(page.getByText(/Refresh admission was not confirmed/)).toBeVisible();
    await page.getByRole("button", { name: "Retry refresh admission", exact: true }).click();
    await expect(page.getByText(/Refresh accepted/)).toBeVisible();
    expect(posts).toHaveLength(2); expect(posts[0]?.key).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
    expect(posts[1]).toEqual(posts[0]); expect(posts[0]?.body).toBe("{}"); expect(posts[0]?.csrf).toBe("synthetic-refresh-csrf");
    await expect(refresh).toBeDisabled();
    await page.getByRole("button", { name: "Check refresh status", exact: true }).click();
    await expect(page.getByText(/new data was published/)).toBeVisible();
    await expect(refresh).toBeEnabled(); expect(posts).toHaveLength(2); expect(reads).toHaveLength(1);
  });
}
