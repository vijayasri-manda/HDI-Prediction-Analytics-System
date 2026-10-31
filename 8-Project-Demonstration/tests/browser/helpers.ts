import { expect, type Page } from "@playwright/test";

// Deliberately fake credential, used only with intercepted provider requests.
export const testKey = "gsk_" + "phase4_test_only_".repeat(3);
export async function configureKey(page: Page, value = testKey) {
  await page.getByRole("button", { name: "AI Settings", exact: true }).first().click();
  await page.getByLabel("Your Groq API key", { exact: true }).fill(value);
  await page.getByRole("button", { name: "Use key for this tab" }).click();
  await expect(page.getByRole("status")).toContainText("Key saved for this tab");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

export async function visiblePlot(page: Page) {
  const svg = page.locator('.chart svg[role="application"]').first();
  await expect(svg).toBeVisible();
  const box = await svg.boundingBox();
  expect(box?.width).toBeGreaterThan(180);
  expect(box?.height).toBeGreaterThan(150);
  await expect(svg.locator(".recharts-cartesian-axis-tick-value").first()).toBeVisible();
}
