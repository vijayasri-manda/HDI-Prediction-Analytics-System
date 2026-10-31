import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { configureKey, testKey, visiblePlot } from "./helpers";

test("real historical series render across countries and selected years", async ({ page }) => {
  const countries = JSON.parse(await readFile("public/data/countries.json", "utf8"));
  await page.goto("/#explore");
  for (const [country, comparison, year] of [["CYP", "CHN", "2023"], ["IND", "USA", "2000"], ["NOR", "AFG", "1990"]]) {
    await page.getByLabel("Explore country").selectOption(country);
    await page.getByLabel("Compare with").selectOption(comparison);
    await page.getByLabel("Observation year").selectOption(year);
    await visiblePlot(page);
    const curve = page.locator(".recharts-area-curve").first();
    const dots = page.locator(".recharts-area-dots").first().locator("circle");
    await expect(dots).toHaveCount(Number(year) - 1990 + 1);
    if (year !== "1990") await expect(curve).toHaveAttribute("d", /^M.+L/);
    await page.getByText("View trend data", { exact: true }).click();
    const last = page.locator(".chart-data tbody tr").last();
    const actual = countries.find((c: { iso3: string }) => c.iso3 === country).history.find((h: {year: number}) => h.year === Number(year)).hdi;
    await expect(last).toContainText(actual.toFixed(3));
    await expect(last.locator("td").first()).toHaveText(year);
    await page.getByText("View trend data", { exact: true }).click();
    await dots.last().hover({ force: true });
    await expect(page.locator(".recharts-tooltip-wrapper")).toContainText(actual.toFixed(3));
  }
  await page.getByLabel("Explore country").selectOption("SSD");
  await page.getByLabel("Compare with").selectOption("SSD");
  await expect(page.getByText("No historical observations are available for this selection.")).toBeVisible();
  await expect(page.locator(".chart")).toHaveCount(0);
});

test("every plot has a nonzero drawing viewport on mobile and desktop in both themes", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const dark of [false, true]) {
      await page.goto("/");
      await expect(page.locator("main h1")).toBeVisible();
      if ((await page.locator("html").getAttribute("data-theme")) !== (dark ? "dark" : "light"))
        await page.getByRole("button", { name: dark ? "Switch to dark mode" : "Switch to light mode" }).click();
      for (const route of ["overview", "explore", "predict", "scenarios", "evaluation"]) {
        await page.goto(`/#${route}`);
        await expect(page.locator("main h1")).toBeVisible();
        if (route === "predict") await page.locator("details.technical-details > summary").click();
        await visiblePlot(page);
        const selector = route === "predict" || route === "scenarios" ? ".recharts-bar-rectangle path" : route === "evaluation" ? ".recharts-scatter-symbol" : ".recharts-area-curve";
        await expect(page.locator(selector).first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  }
});

test("personal keys stay in memory, show honest status, change, remove and clear on refresh", async ({ page }) => {
  const requests: string[] = [];
  let status = 401;
  await page.route("**/api/insights", async (route) => {
    requests.push(route.request().headers()["x-groq-api-key"]);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ code: status === 401 ? "invalid_api_key" : "rate_limited" }) });
  });
  await page.goto("/#insights");
  await expect(page.getByRole("button", { name: "Generate explanation" })).toBeDisabled();
  await configureKey(page);
  expect(requests).toHaveLength(0);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(testKey);
  await page.getByRole("button", { name: "Generate explanation" }).click();
  await expect(page.getByRole("alert")).toContainText("did not accept");
  await page.getByRole("button", { name: "AI Settings", exact: true }).first().click();
  await expect(page.locator(".settings-status")).toContainText("Key was not accepted");
  await page.getByRole("button", { name: "Change key", exact: true }).click();
  const replacement = "gsk_" + "replacement_test_".repeat(3);
  await page.getByLabel("Replace your Groq API key").fill(replacement);
  await expect(page.getByLabel("Replace your Groq API key")).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show API key" }).click();
  await expect(page.getByLabel("Replace your Groq API key")).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Use key for this tab" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  status = 429;
  await page.getByRole("button", { name: "Generate explanation" }).click();
  await expect(page.getByRole("alert")).toContainText("request limit");
  expect(requests).toEqual([testKey, replacement]);
  await page.getByRole("button", { name: "AI Settings", exact: true }).first().click();
  await page.getByRole("button", { name: "Remove key from this tab" }).click();
  await expect(page.locator(".settings-status")).toContainText("No personal key");
  await page.keyboard.press("Escape");
  await configureKey(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Generate explanation" })).toBeDisabled();
});
