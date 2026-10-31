import { test, expect } from "@playwright/test";
import { configureKey } from "./helpers";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test("historical filters, exact exported records, missing year and historical preset", async ({
  page,
}) => {
  await page.goto("/#explore");
  await page.getByLabel("Observation year").selectOption("2000");
  await page.getByLabel("Region", { exact: true }).selectOption("South Asia");
  await page.getByLabel("Explore country").selectOption("IND");
  await page.getByLabel("Search countries").fill("India");
  await expect(page.locator(".country-table tbody tr")).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export filtered data" }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.year).toBe(2000);
  expect(exported.data).toHaveLength(1);
  const row = exported.data[0];
  expect(row.iso3).toBe("IND");
  expect(row.year).toBe(2000);
  expect(row.hdi).not.toBe(0.685);
  await page.getByRole("button", { name: "Use these indicators" }).click();
  await expect(page.getByText(/Starting country/)).toContainText(
    "2000",
  );
  await expect(page.getByLabel("Life expectancy", { exact: true })).toHaveValue(
    row.life_expectancy.toFixed(2),
  );
  await page.getByLabel("Life expectancy", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("Life expectancy", { exact: true })).toHaveValue(
    row.life_expectancy.toFixed(2),
  );
  await page.goto("/#explore");
  await page.getByLabel("Explore country").selectOption("SSD");
  await page.getByLabel("Observation year").selectOption("1990");
  await expect(
    page.getByText(/No complete indicator record is available/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use these indicators" }),
  ).toHaveCount(0);
});

test("prediction export and contextual AI success keep numerical evidence separate", async ({
  page,
}) => {
  await page.goto("/#predict");
  await page.getByRole("button", { name: "Calculate HDI estimate" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export result", exact: true })
    .click();
  const data = JSON.parse(
    await readFile((await (await downloadPromise).path())!, "utf8"),
  );
  expect(data.input.life_expectancy).toBe(72);
  expect(data.predictedHDI).toBeGreaterThan(0.67);
  expect(data.formulaReference).not.toBe(data.predictedHDI);
  await page.route("**/api/insights", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.baseline).toEqual(data.input);
    expect(body.question).toContain("Explain");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        explanation:
          "Test provider response: **reconstruction**, not a future forecast.\n\n| Indicator | Value |\n| --- | --- |\n| Life expectancy | 72 |\n\n<img src=x onerror=alert(1)>",
      }),
    });
  });
  await page.getByRole("button", { name: "Explain this result" }).click();
  await expect(page).toHaveURL(/#predict$/);
  await configureKey(page);
  await page.getByRole("button", { name: "Generate explanation" }).click();
  await expect(page.locator(".ai-answer")).toContainText(
    "Test provider response",
  );
  await expect(page.locator(".ai-answer strong")).toHaveText("reconstruction");
  await expect(page.locator(".ai-answer table tbody tr")).toHaveCount(1);
  await expect(page.locator(".ai-answer img")).toHaveCount(0);
  await page.getByRole("button", { name: "Close explanation panel" }).click();
  await expect(page.locator("#ai-context")).toHaveCount(0);
});

test("historical download failure offers a working retry", async ({ page }) => {
  await page.route("**/data/explorer.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/#explore");
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await page.unroute("**/data/explorer.json");
  await page.getByRole("button", { name: "Retry historical data" }).click();
  await expect(page.getByLabel("Observation year")).toBeVisible();
});

test("dark theme remains accessible on every route and expanded technical details", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("hdi-theme", "dark"));
  for (const route of [
    "overview",
    "explore",
    "predict",
    "scenarios",
    "insights",
    "evaluation",
  ]) {
    await page.goto("/#" + route);
    await expect(page.locator("main h1")).toBeVisible();
    if (route === "explore")
      await expect(page.getByLabel("Observation year")).toBeVisible();
    for (const detail of await page.locator("details").all())
      await detail.evaluate((el) => {
        el.setAttribute("open", "");
      });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations,
      JSON.stringify(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  }
});
