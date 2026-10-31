/* global document, innerWidth, window */
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const folder = "../6. Project Testing";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
const manifest = { date: new Date().toISOString(), source: "Actual local Chromium browser; no AI output fixtures or credentials used", screenshots: [] };
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
async function capture(name, locator, state) {
  await locator.screenshot({ path: `${folder}/${name}.png` });
  manifest.screenshots.push({ file: `${name}.png`, state });
}
async function route(id) {
  await page.goto(`http://127.0.0.1:5173/#${id}`);
  await expect(page.locator("main h1")).toBeVisible();
}
async function screenshot(name, state) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${folder}/${name}.png` });
  manifest.screenshots.push({ file: `${name}.png`, state });
}
try {
  await route("overview");
  await expect(page.locator(".dataset-strip")).toContainText("5,940");
  await screenshot("home", "Default India 2023 summary, published data and navbar");
  await route("explore");
  await page.getByLabel("Explore country").selectOption("CYP");
  await page.getByLabel("Compare with").selectOption("CHN");
  await expect(page.locator('.chart svg[role="application"]')).toBeVisible();
  await screenshot("explore", "Cyprus and China, observations through 2023");
  await capture("trend-detail", page.locator(".overview-grid > .panel").first(), "Actual Cyprus/China chart and published 2023 summary");
  await route("predict");
  await page.getByRole("button", { name: "Calculate HDI estimate" }).click();
  manifest.prediction = { score: (await page.locator(".score-number").innerText()).replace(/\s+/g," "), inputs: await page.locator('.indicator-field input[type="number"]').evaluateAll(nodes => nodes.map(n => ({ id: n.id, value: n.value }))) };
  await screenshot("predictor", "Genuine India preset calculation; no AI request");
  await page.getByRole("button", { name: "Explore a scenario" }).click();
  await page.getByLabel("Life expectancy", { exact: true }).fill("78");
  await page.getByLabel("Mean schooling", { exact: true }).fill("10");
  manifest.scenario = { delta: await page.locator(".delta-card strong").innerText(), inputs: await page.locator('.indicator-field input[type="number"]').evaluateAll(nodes => nodes.map(n => ({ id: n.id, value: n.value }))) };
  await screenshot("scenarios", "Baseline India preset; scenario life expectancy 78 and mean schooling 10");
  await route("evaluation");
  await expect(page.locator(".recharts-scatter-symbol").first()).toBeVisible();
  await screenshot("methodology", "Committed evaluation metrics and held-out scatter samples");
  await page.getByRole("button", { name: "AI Settings", exact: true }).click();
  await expect(page.getByLabel("Your Groq API key", { exact: true })).toHaveValue("");
  await capture("ai-settings", page.getByRole("dialog"), "Unconfigured settings dialog, empty credential field");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 950 });
  await route("explore");
  await page.getByLabel("Explore country").selectOption("CYP");
  await page.getByLabel("Compare with").selectOption("CHN");
  await capture("explore-mobile", page.locator(".overview-grid > .panel").first(), "390px viewport; actual responsive Cyprus/China plot");
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error("Mobile page overflow");
  if (errors.length) throw new Error(errors.join("\n"));
  const evidence = JSON.parse(await readFile(`${folder}/report-evidence.json`, "utf8"));
  evidence.captures = manifest;
  await writeFile(`${folder}/report-evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(`Captured ${manifest.screenshots.length} actual application screenshots; no provider requests or keys.`);
} finally { await browser.close(); }
