/** The same exported sklearn estimator runs in the browser, tests and API. */
export const fields = [
  {
    key: "life_expectancy",
    label: "Life expectancy",
    unit: "years",
    min: 20,
    max: 95,
    step: 0.1,
    description:
      "Expected lifespan at birth under current mortality conditions.",
  },
  {
    key: "expected_schooling",
    label: "Expected schooling",
    unit: "years",
    min: 0,
    max: 25,
    step: 0.1,
    description: "Years of education a child entering school can expect.",
  },
  {
    key: "mean_schooling",
    label: "Mean schooling",
    unit: "years",
    min: 0,
    max: 20,
    step: 0.1,
    description: "Average completed schooling for adults aged 25 and older.",
  },
  {
    key: "gni_per_capita",
    label: "GNI per capita",
    unit: "2021 PPP $",
    min: 100,
    max: 200000,
    step: 100,
    description:
      "Gross national income per person, in constant 2021 purchasing power parity dollars.",
  },
];
export function validateInputs(input) {
  const errors = {};
  for (const f of fields) {
    const value = input?.[f.key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < f.min ||
      value > f.max
    )
      errors[f.key] =
        `Enter a number between ${f.min.toLocaleString("en-US")} and ${f.max.toLocaleString("en-US")}.`;
  }
  return errors;
}
export function category(value) {
  return value >= 0.8
    ? "Very high"
    : value >= 0.7
      ? "High"
      : value >= 0.55
        ? "Medium"
        : "Low";
}
export function dimensions(input) {
  const cap = (v) => Math.max(0, Math.min(1, v));
  return [
    { name: "Health", value: cap((input.life_expectancy - 20) / 65) },
    {
      name: "Education",
      value:
        (cap(input.expected_schooling / 18) + cap(input.mean_schooling / 15)) /
        2,
    },
    {
      name: "Income",
      value: cap(Math.log(input.gni_per_capita / 100) / Math.log(750)),
    },
  ];
}
export function formulaHDI(input) {
  return Math.cbrt(dimensions(input).reduce((a, d) => a * d.value, 1));
}
export function predict(model, input) {
  if (Object.keys(validateInputs(input)).length)
    throw new Error("Invalid indicator values.");
  if (model.schemaVersion !== 1) throw new Error("Unsupported model artifact.");
  // sklearn's tree inference casts inputs to float32. Preserve that at split boundaries.
  const x = model.features.map((key) =>
    key === "gni_per_capita" ? Math.log(input[key]) : input[key],
  );
  if (model.kind === "linear")
    return Math.max(
      0,
      Math.min(
        1,
        model.intercept +
          x.reduce((v, n, i) => v + n * model.coefficients[i], 0),
      ),
    );
  const xf = x.map(Math.fround);
  return (
    model.trees.reduce((sum, t) => {
      let i = 0;
      while (t.left[i] !== -1)
        i = xf[t.feature[i]] <= t.threshold[i] ? t.left[i] : t.right[i];
      return sum + t.value[i];
    }, 0) / model.trees.length
  );
}
export function sensitivity(model, input) {
  const base = predict(model, input);
  return fields.map((f) => ({
    name: f.label,
    key: f.key,
    value: base - predict(model, { ...input, [f.key]: model.medians[f.key] }),
  }));
}
export function outOfDomain(model, input) {
  return fields
    .filter(
      (f) =>
        input[f.key] < model.ranges[f.key][0] ||
        input[f.key] > model.ranges[f.key][1],
    )
    .map((f) => f.label);
}
