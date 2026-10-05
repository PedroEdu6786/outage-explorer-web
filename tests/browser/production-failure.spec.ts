import { test, expect } from "@playwright/test";
test("unconfigured production routes fail closed without fixture fallback or fabricated backend traffic", async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => { errors.push(error.message); });
  page.on("request", (request) => { if (["fetch", "xhr"].includes(request.resourceType())) requests.push(request.url()); });
  for (const path of ["/", "/sign-in", "/overview", "/datasets", "/query"]) {
    await page.goto(path);
    await expect(page.getByText("Sign-in unavailable", { exact: true })).toBeVisible();
    await expect(page.getByText("Backend connection unavailable. Session and data contracts are awaiting configuration.", { exact: true })).toBeVisible();
    await expect(page.locator('[data-fixture-root]')).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main navigation", includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("table", { includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "SQL statement", includeHidden: true })).toHaveCount(0);
    await expect(page.getByText(/synthetic|prototype sample data/i)).toHaveCount(0);
    await page.getByRole("button", { name: "Check session again", exact: true }).click();
    await expect(page.getByText("Sign-in unavailable", { exact: true })).toBeVisible();
  }
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
