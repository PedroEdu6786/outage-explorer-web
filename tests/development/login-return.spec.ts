import { test, expect } from "@playwright/test";

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
        await expect(page.getByText("Data services are not connected yet.", { exact: true })).toBeVisible();
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
