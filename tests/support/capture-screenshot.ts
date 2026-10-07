import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Page, TestInfo } from "@playwright/test";

/** Only the capture project writes PNGs, inside its ignored per-test output. */
export async function captureScreenshot(page: Page, testInfo: TestInfo, filename: string, options: { readonly fullPage?: boolean } = {}): Promise<void> {
  if (testInfo.project.metadata.captureScreenshots !== true) return;

  const path = testInfo.outputPath(filename);
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, animations: "disabled", ...options });
}
