import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  category,
  dimensions,
  formulaHDI,
  predict,
  validateInputs,
  sensitivity,
  fields,
  outOfDomain,
} from "../shared/inference.mjs";
const read = (name) =>
  JSON.parse(
    readFileSync(
      new URL(`../public/data/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const model = read("model"),
  evaluation = read("evaluation"),
  countries = read("countries"),
  parity = read("parity");
const india = countries.find((c) => c.iso3 === "IND");
test("extreme valid inputs remain finite and bounded, and invalid model versions fail", () => {
  for (const bound of ["min", "max"]) {
    const input = Object.fromEntries(fields.map((f) => [f.key, f[bound]]));
    const output = predict(model, input);
    assert.ok(Number.isFinite(output) && output >= 0 && output <= 1);
  }
  assert.throws(
    () => predict({ ...model, schemaVersion: 99 }, india),
    /Unsupported/,
  );
});
test("JavaScript matches all exported Python held-out and random reference cases", () => {
  let worst = 0;
  for (const fixture of parity)
    worst = Math.max(
      worst,
      Math.abs(predict(model, fixture.input) - fixture.prediction),
    );
  assert.equal(parity.length, evaluation.parityCases);
  assert.ok(worst < 1e-12, `Maximum error ${worst}`);
  console.log(
    `Python/JavaScript parity: ${parity.length} cases; maximum absolute error ${worst}`,
  );
});
test("invalid, nonfinite, missing and out-of-range inputs fail for every feature", () => {
  for (const f of fields)
    for (const value of [
      null,
      undefined,
      NaN,
      Infinity,
      -Infinity,
      "70",
      f.min - 1,
      f.max + 1,
    ]) {
      const row = { ...india, [f.key]: value };
      assert.ok(validateInputs(row)[f.key]);
      assert.throws(() => predict(model, row));
    }
});
test("different schooling cohorts may have mean greater than expected", () => {
  assert.deepEqual(
    validateInputs({ ...india, expected_schooling: 8, mean_schooling: 10 }),
    {},
  );
});
test("category thresholds use full precision", () => {
  assert.deepEqual(
    [0.549999, 0.55, 0.699999, 0.7, 0.799999, 0.8, 1].map(category),
    ["Low", "Medium", "Medium", "High", "High", "Very high", "Very high"],
  );
});
test("UNDP formula matches technical-note Benin example and caps individual components", () => {
  assert.ok(
    Math.abs(
      formulaHDI({
        life_expectancy: 60.8,
        expected_schooling: 10.4,
        mean_schooling: 3.2,
        gni_per_capita: 3806,
      }) - 0.515,
    ) < 0.001,
  );
  assert.equal(
    formulaHDI({
      life_expectancy: 20,
      expected_schooling: 0,
      mean_schooling: 0,
      gni_per_capita: 100,
    }),
    0,
  );
  assert.equal(
    formulaHDI({
      life_expectancy: 95,
      expected_schooling: 25,
      mean_schooling: 20,
      gni_per_capita: 200000,
    }),
    1,
  );
  assert.equal(
    dimensions({
      life_expectancy: 85,
      expected_schooling: 25,
      mean_schooling: 7.5,
      gni_per_capita: 75000,
    })[1].value,
    0.75,
  );
});
test("scenario changes use actual inference; reset is exactly identical", () => {
  const base = predict(model, india);
  assert.notEqual(predict(model, { ...india, gni_per_capita: 50000 }), base);
  assert.equal(predict(model, { ...india }) - base, 0);
  assert.equal(
    sensitivity(model, model.medians).every((x) => x.value === 0),
    true,
  );
  assert.ok(
    outOfDomain(model, { ...india, life_expectancy: 20 }).includes(
      "Life expectancy",
    ),
  );
});
test("train, validation and test countries are disjoint", () => {
  const { train, validation, test: heldout } = evaluation.split.groups;
  assert.equal(
    new Set([...train, ...validation, ...heldout]).size,
    train.length + validation.length + heldout.length,
  );
  assert.equal(
    evaluation.split.train +
      evaluation.split.validation +
      evaluation.split.test,
    evaluation.rows,
  );
});
test("source checksum and country data provenance agree", () => {
  const raw = readFileSync(
    new URL("../data/raw/undp_hdr2025.csv", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(raw).digest("hex"),
    evaluation.sha256,
  );
  assert.equal(countries.length, evaluation.latestCountries);
  assert.equal(new Set(countries.map((c) => c.iso3)).size, countries.length);
  for (const c of countries) {
    assert.equal(c.year, 2023);
    assert.deepEqual(validateInputs(c), {});
    assert.ok(c.hdi >= 0 && c.hdi <= 1);
    assert.ok(!c.country.includes("Peer"));
    assert.equal(c.history.at(-1).hdi, c.hdi);
  }
});
