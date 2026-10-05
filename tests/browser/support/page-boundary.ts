import { expect, type Page } from "@playwright/test";
export interface Call { readonly operation: string; readonly input: unknown; readonly outcome: string }
export async function openPage(page: Page, story: string) {
  await page.goto(`/iframe.html?id=pages-${story}&viewMode=story`);
  await expect(page.locator('[data-fixture-root="synthetic-only"]').getByRole("note")).toContainText("Synthetic fixture page demo");
}
export async function calls(page: Page): Promise<readonly Call[]> {
  await page.getByRole("button", { name: "Inspect synthetic calls", exact: true }).click();
  return JSON.parse(await page.getByTestId("call-trace").innerText()) as readonly Call[];
}
export async function navigate(page: Page, name: string) {
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  if (await trigger.isVisible()) await trigger.click();
  await page.getByRole("link", { name, exact: true }).click();
}
