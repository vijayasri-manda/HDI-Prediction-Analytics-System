import { test, expect } from "@playwright/test";
test("built production assets load and core inference works offline after initial load", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main h1")).toHaveText(/Human Development,/);
  await page.getByRole("link", { name: "HDI Predictor", exact: true }).click();
  await page.reload();
  await expect(page.locator("main h1")).toHaveText(
    "From indicators to insight.",
  );
  await context.setOffline(true);
  await page.getByLabel("Life expectancy", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Calculate HDI estimate" }).click();
  await expect(
    page.getByText("Calculated from your current inputs"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore a scenario" }).click();
  await page.getByLabel("Mean schooling", { exact: true }).fill("12");
  await expect(page.locator(".delta-card strong")).not.toHaveText("+0.0000");
  expect(errors).toEqual([]);
});
