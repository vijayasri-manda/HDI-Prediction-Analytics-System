export type Inputs = {
  life_expectancy: number;
  expected_schooling: number;
  mean_schooling: number;
  gni_per_capita: number;
};
export type Country = Inputs & {
  iso3: string;
  country: string;
  region: string;
  year: number;
  hdi: number;
  history: { year: number; hdi: number }[];
};
export type Model = {
  schemaVersion: number;
  name: string;
  kind: string;
  features: (keyof Inputs)[];
  medians: Inputs;
  ranges: Record<keyof Inputs, [number, number]>;
  trees?: unknown[];
};
export type Metrics = { mae: number; rmse: number; r2: number };
export type Evaluation = {
  name: string;
  dataset: string;
  source: string;
  sourcePage: string;
  sha256: string;
  rows: number;
  countries: number;
  latestCountries: number;
  years: number[];
  droppedRows: number;
  versions: Record<string, string>;
  selection: string;
  split: {
    train: number;
    validation: number;
    test: number;
    groups: Record<string, string[]>;
  };
  comparison: (Metrics & { name: string })[];
  test: Metrics;
  formula: Metrics;
  temporal: Metrics;
  importance: { feature: string; value: number; std: number }[];
  residuals: { actual: number; predicted: number }[];
  limitations: string[];
  parityCases: number;
  syntheticAudit: Record<string, Metrics>;
};
export type Assets = {
  countries: Country[];
  model: Model;
  evaluation: Evaluation;
};
