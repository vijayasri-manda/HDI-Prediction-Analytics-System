import { test, expect } from "@playwright/test";
import { configureKey } from "./helpers";
import AxeBuilder from "@axe-core/playwright";
test("desktop workflow: observed data, prediction, scenario reset, AI fallback, evaluation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Human Development,/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore Global Data", exact: true })
    .click();
  await page.getByLabel("Search countries").fill("India");
  await expect(page.locator(".country-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Search countries").fill("not-a-country");
  await expect(
    page.getByText("No countries match these filters."),
  ).toBeVisible();
  await page.getByLabel("Search countries").fill("");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("link", { name: "HDI Predictor", exact: true }).click();
  await page.getByLabel("Life expectancy", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Calculate HDI estimate" }),
  ).toBeDisabled();
  await page.getByLabel("Life expectancy", { exact: true }).fill("76");
  await page.getByRole("button", { name: "Calculate HDI estimate" }).click();
  await expect(
    page.getByText("Calculated from your current inputs"),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Explore a scenario" }).click();
  await page.getByLabel("GNI per capita", { exact: true }).fill("");
  await expect(page.locator(".delta-card strong")).toHaveText(
    "Enter valid inputs",
  );
  await expect(
    page.getByRole("img", { name: "Baseline and scenario dimension indices" }),
  ).toHaveCount(0);
  await page.getByLabel("GNI per capita", { exact: true }).fill("25000");
  await expect(page.locator(".delta-card strong")).not.toHaveText("+0.0000");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".delta-card strong")).toHaveText("+0.0000");
  await page.getByLabel("Mean schooling", { exact: true }).fill("12");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Explain comparison" }).click();
  await page.getByLabel("Include current scenario").check();
  await page.route("**/api/insights", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "AI is temporarily unavailable." }),
    }),
  );
  await configureKey(page);
  await page.getByRole("button", { name: "Generate explanation" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("link", { name: "Methodology", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evidence behind the estimate." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Evidence behind the estimate." }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(errors).toEqual([]);
});
test("keyboard and accessibility on all modules", async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const hash of [
    "overview",
    "explore",
    "predict",
    "scenarios",
    "insights",
    "evaluation",
  ]) {
    await page.goto(`/#${hash}`);
    await expect(page.locator("main h1")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(
        results.violations.map((x) => ({
          id: x.id,
          nodes: x.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  }
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
test("responsive layouts and theme persistence", async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of [
      "overview",
      "explore",
      "predict",
      "scenarios",
      "insights",
      "evaluation",
    ]) {
      await page.goto(`/#${hash}`);
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#site-navigation")).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("#site-navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "HDI Predictor", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText(
    "From indicators to insight.",
  );
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => window.scrollTo(0, 0));
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
test("model download failure has a retry state", async ({ page }) => {
  await page.route("**/data/model.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible();
});
