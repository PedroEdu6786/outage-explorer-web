import { expect, test } from "@playwright/test";

test("real Flask session proxy resolves signed-out UI without restricted content", async ({ page, request }) => {
  const session = await request.get("/api/auth/session");
  expect(session.status()).toBe(401);
  expect(session.headers()["cache-control"]).toContain("no-store");
  await page.goto("/overview");
  await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toBeEnabled();
  await expect(page.getByRole("navigation", { name: "Main navigation", includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole("table", { includeHidden: true })).toHaveCount(0);
  await expect(page.locator('[data-fixture-root]')).toHaveCount(0);
});

test("real Flask login proxy preserves redirect and binding cookie", async ({ request }) => {
  const response = await request.get("/api/auth/login?return_to=%2F", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  // Assert booleans rather than serialize actual cookie or PKCE/state values on failure.
  const location = response.headers().location;
  expect(Boolean(location && new URL(location).protocol === "https:")).toBe(true);
  expect(Boolean(response.headers()["set-cookie"]?.includes("HttpOnly"))).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("real Flask logout accepts the browser UI origin for an already signed-out session", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Continue to sign in", exact: true })).toBeEnabled();
  const status = await page.evaluate(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store", redirect: "error" });
    return response.status;
  });
  expect(status).toBe(204);
});
