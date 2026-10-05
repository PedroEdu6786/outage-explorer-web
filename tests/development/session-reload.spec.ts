import { test, expect } from "@playwright/test";

// Analytical failures stay inside this controlled browser root; never reach Flask.
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/(?:datasets|query)(?:[/?]|$)/, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "service_unavailable" }) }));
});

for (const role of ["viewer", "analyst", "admin"] as const) {
  test(`${role} reload restores the existing cookie session without a login screen`, async ({ page, context }) => {
    // A controlled HttpOnly browser cookie and intercepted session endpoint;
    // this verifies reload transport/UI, not live backend session acceptance.
    await context.addCookies([{ name: "synthetic_reload_session", value: "synthetic-only", domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
    const expiresAt = new Date(Date.now() + 600_000).toISOString();
    let gate: Promise<void> | null = null;
    let release!: () => void;
    let sentCookie = false;
    let loginRequests = 0;
    await page.route("**/api/auth/login**", (route) => { loginRequests += 1; return route.abort(); });
    await page.route("**/api/auth/session", async (route) => {
      sentCookie = route.request().headers().cookie?.includes("synthetic_reload_session=synthetic-only") ?? false;
      if (gate) await gate;
      await route.fulfill({ status: sentCookie ? 200 : 401, contentType: "application/json", body: JSON.stringify({
        user: { id: "synthetic-reload-user", email: "reload@example.invalid", role }, expires_at: expiresAt, csrf_token: "synthetic-reload-csrf",
      }) });
    });
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
    for (let reload = 0; reload < 2; reload += 1) {
      gate = new Promise<void>((resolve) => { release = resolve; });
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: "Restoring your session" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toHaveCount(0);
        await expect(page.getByRole("navigation", { name: "Main navigation", includeHidden: true })).toHaveCount(0);
      } finally { release(); }
      await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
      await expect(page).toHaveURL(/\/overview$/);
      expect(sentCookie).toBe(true); expect(loginRequests).toBe(0);
      await expect(page.getByRole("link", { name: "SQL Workspace", exact: true })).toHaveCount(role === "viewer" ? 0 : 1);
      await expect(page.getByRole("button", { name: "Refresh data", exact: true })).toHaveCount(role === "admin" ? 1 : 0);
      gate = null;
    }
  });
}
