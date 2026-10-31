import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("every explorer record exactly matches the unchanged processed panel", () => {
  const rows = JSON.parse(
    readFileSync(new URL("../public/data/explorer.json", import.meta.url)),
  );
  const csv = readFileSync(
    new URL("../data/processed/undp_panel.csv", import.meta.url),
    "utf8",
  )
    .trim()
    .split(/\r?\n/);
  const headers = csv.shift().split(",");
  const keys = [
    "iso3",
    "year",
    "life_expectancy",
    "expected_schooling",
    "mean_schooling",
    "gni_per_capita",
    "hdi",
  ];
  assert.equal(rows.length, 5940);
  assert.equal(new Set(rows.map((r) => r.iso3)).size, 193);
  // Country names can contain commas; numeric fields are always the final six columns.
  csv.forEach((line, i) => {
    const parts = line.split(",");
    const expected = { iso3: parts[0] };
    headers.slice(-6).forEach((key, j) => {
      expected[key] = Number(parts[parts.length - 6 + j]);
    });
    keys.forEach((key) => assert.equal(rows[i][key], expected[key]));
  });
});
