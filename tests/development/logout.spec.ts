import { expect, test } from "@playwright/test";

// Analytical failures stay inside this controlled browser root; never reach Flask.
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/(?:datasets|query)(?:[/?]|$)/, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "service_unavailable" }) }));
});

// Controlled HTTP/provider responses on actual Next routes. This does not prove
// that a real Cognito browser session was cleared or that credentials are requested.
for (const status of [204, 503] as const) {
  test(`logout ${String(status)} ${status === 204 ? "navigates to Cognito and returns signed out" : "preserves retry without provider navigation"}`, async ({ page }) => {
    let signedOut = false;
    let providerVisits = 0;
    await page.route("**/api/auth/session", (route) => route.fulfill({
      status: signedOut ? 401 : 200, contentType: "application/json",
      body: JSON.stringify(signedOut ? { error: "unauthenticated" } : {
        user: { id: "synthetic-logout-user", email: "logout@example.invalid", role: "viewer" },
        expires_at: new Date(Date.now() + 600_000).toISOString(), csrf_token: "synthetic-logout-csrf",
      }),
    }));
    await page.route("**/api/auth/logout", async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-logout-csrf");
      signedOut = status === 204;
      await route.fulfill({ status });
    });
    await page.route((url) => url.protocol === "https:" && url.pathname === "/logout", async (route) => {
      providerVisits++;
      expect(signedOut).toBe(true);
      expect(route.request().isNavigationRequest()).toBe(true);
      const url = new URL(route.request().url());
      expect([...url.searchParams.keys()]).toEqual(["client_id", "logout_uri"]);
      expect(url.searchParams.get("client_id")).toBeTruthy();
      expect(url.searchParams.get("logout_uri")).toBe("http://localhost:3000/sign-in");
      await route.fulfill({ status: 302, headers: { location: "http://localhost:3000/sign-in" } });
    });
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: "U.S. Nuclear Outage Overview" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    if (status === 204) {
      await expect(page).toHaveURL("http://localhost:3000/sign-in");
      await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toBeEnabled();
      expect(providerVisits).toBe(1);
    } else {
      await expect(page.getByText("Sign-out not confirmed", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Retry sign out", exact: true })).toBeEnabled();
      expect(providerVisits).toBe(0);
    }
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  });
}
