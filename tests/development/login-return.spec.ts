import { test, expect } from "@playwright/test";

// Analytical failures stay inside this controlled browser root; never reach Flask.
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/(?:datasets|query)(?:[/?]|$)/, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "service_unavailable" }) }));
});

// Controlled browser regression, not live Cognito/session acceptance. Only the
// session response is synthetic; actual Next routes and production composition run.
for (const role of [null, "viewer", "analyst", "admin"] as const) {
  test(`login return redirects safely and resolves ${role ?? "signed-out"} session in development`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => { errors.push(error.message); });
    await page.route("**/api/auth/session", (route) => route.fulfill({
      status: role ? 200 : 401, contentType: "application/json",
      body: JSON.stringify(role ? {
        user: { id: "synthetic-browser-user", email: "browser@example.invalid", role },
        expires_at: new Date(Date.now() + 600_000).toISOString(),
        csrf_token: "synthetic-browser-regression-token",
      } : { error: "unauthenticated" }),
    }));
    const redirect = await request.get("/", { maxRedirects: 0 });
    expect(redirect.status()).toBe(307);
    expect(redirect.headers().location).toBe("/overview");

    for (const path of ["/", "/sign-in"]) {
      await page.goto(path);
      await expect(page).toHaveURL(path === "/sign-in" && !role ? /\/sign-in$/ : /\/overview$/);
      if (role) {
        await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
        await expect(page.getByText("The service is unavailable. Try again deliberately.", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toHaveCount(0);
      } else {
        // Signed-out /sign-in stays there; the root return lands on /overview.
        await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toBeEnabled();
        await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
      }
      await expect(page.locator("[data-fixture-root]")).toHaveCount(0);
      expect(errors).toEqual([]);
    }
  });
}

for (const role of ["viewer", "analyst", "admin"] as const) {
  test(`${role} direct Explorer and SQL access follows page restrictions`, async ({ page }) => {
    await page.route("**/api/auth/session", (route) => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({
        user: { id: "synthetic-browser-user", email: "browser@example.invalid", role },
        expires_at: new Date(Date.now() + 600_000).toISOString(), csrf_token: "synthetic-browser-regression-token",
      }),
    }));
    for (const path of ["/datasets", "/query"]) {
      await page.goto(path);
      await expect(page).toHaveURL(role === "viewer" ? /\/overview$/ : new RegExp(`${path}$`));
      if (role === "viewer") {
        await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Dataset Explorer", exact: true })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "SQL Workspace", exact: true })).toHaveCount(0);
        await expect(page.getByRole("textbox", { name: "SQL statement", includeHidden: true })).toHaveCount(0);
      } else {
        await expect(page.getByRole("link", { name: "Dataset Explorer", exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "SQL Workspace", exact: true })).toBeVisible();
      }
    }
  });
}
