import { Activity, Check, ArrowRight, Sparkles, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  predict,
  sensitivity,
  validateInputs,
  formulaHDI,
  fields,
} from "../../shared/inference.mjs";
import {
  Panel,
  CountrySelect,
  IndicatorForm,
  Reset,
  Score,
  Notice,
  DimensionBars,
  DomainNotice,
  downloadJSON,
  number,
  signed,
} from "../components";
import type { Assets, Inputs } from "../types";
import useReducedMotion from "../useReducedMotion";
export default function Predictor({
  assets,
  country,
  presetYear,
  preset,
  onCountry,
  draft,
  setDraft,
  baseline,
  ran,
  onRun,
  onScenario,
  onInsights,
}: {
  assets: Assets;
  country: string;
  presetYear: number;
  preset: Inputs;
  onCountry: (id: string) => void;
  draft: Inputs;
  setDraft: (v: Inputs) => void;
  baseline: Inputs;
  ran: boolean;
  onRun: () => void;
  onScenario: () => void;
  onInsights: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const valid = !Object.keys(validateInputs(draft)).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const result = predict(assets.model, baseline);
  const effects = sensitivity(assets.model, baseline);
  return (
    <>
      <div className="two-columns predictor-grid">
        <Panel
          title="Start with four indicators"
          eyebrow="01 / INPUTS"
          action={<span className="pill subtle">4 model features</span>}
        >
          <CountrySelect
            id="predict-country"
            countries={assets.countries}
            value={country}
            onChange={onCountry}
            label="Load a published 2023 country preset"
          />
          <p className="caption">
            Starting country:{" "}
            {assets.countries.find((c) => c.iso3 === country)?.country} /{" "}
            {presetYear}. Change any indicator below to experiment.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) onRun();
            }}
            noValidate
          >
            <IndicatorForm input={draft} onChange={setDraft} prefix="predict" />
            <div className="form-actions">
              <button type="submit" className="button" disabled={!valid}>
                <Activity size={17} />
                Calculate HDI estimate
              </button>
              <Reset onClick={() => setDraft({ ...preset })} />
            </div>
          </form>
          <p className="caption">
            Preset inputs are rounded to two decimals. Editing values creates a
            hypothetical set of indicators. Mean and expected schooling describe
            different age cohorts and are validated independently.
          </p>
        </Panel>
        <Panel
          title="Your model result"
          eyebrow="02 / ESTIMATE"
          className="result-panel"
        >
          <div aria-live="polite">
            <Score
              value={result}
              label={
                ran ? "Calculated ML estimate" : "Initial preset ML estimate"
              }
            />
            {dirty && (
              <Notice>
                Inputs have changed. Calculate again to update this result.
              </Notice>
            )}
            {ran && !dirty && (
              <p className="success-note">
                <Check size={16} />
                Calculated from your current inputs
              </p>
            )}
          </div>
          <DimensionBars input={baseline} />
          <details className="chart-data">
            <summary>Review the four inputs used</summary>
            <dl className="indicator-summary">
              {fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {number(baseline[f.key as keyof Inputs], 2)} {f.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="formula-comparison">
            <span>
              Formula reference
              <small>Calculated directly from the same inputs</small>
            </span>
            <strong>{formulaHDI(baseline).toFixed(3)}</strong>
          </div>
          <DomainNotice model={assets.model} input={baseline} />
          <Notice>
            This model reconstructs HDI from its component indicators. It does
            not predict future country outcomes. The direct formula is the
            appropriate reference when all four inputs are known.
          </Notice>
          <div className="stack-actions">
            <button className="button" onClick={onScenario}>
              Explore a scenario <ArrowRight size={16} />
            </button>
            <button className="button secondary" onClick={onInsights}>
              <Sparkles size={16} />
              Explain this result
            </button>
          </div>
          <button
            className="text-button"
            onClick={() =>
              document.getElementById("predict-life_expectancy")?.focus()
            }
          >
            Adjust inputs & run again <ArrowRight size={16} />
          </button>
          <button
            className="text-button"
            onClick={() =>
              downloadJSON(
                {
                  kind: "Model estimate",
                  model: assets.model.name,
                  input: baseline,
                  predictedHDI: result,
                  formulaReference: formulaHDI(baseline),
                },
                "hdi-model-result.json",
              )
            }
          >
            <Download size={15} />
            Export result
          </button>
        </Panel>
      </div>
      <details className="technical-details">
        <summary>Explore model sensitivity & input effects</summary>
        <Panel
          title="How the model responds to your inputs"
          eyebrow="LOCAL SENSITIVITY"
        >
          <p className="panel-description">
            Each bar shows how the prediction changes when one current input is
            replaced with its training median, keeping the other three fixed.
            Positive means the current value raises the estimate relative to
            that replacement.
          </p>
          <div className="two-columns">
            <div
              className="chart"
              role="img"
              aria-label="One-feature replacement sensitivity, with exact values in the adjacent table"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={effects}
                  layout="vertical"
                  margin={{ left: 35, right: 25 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 5" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => Number(v).toLocaleString("en-US", { maximumSignificantDigits: 3 })}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={125}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(v) => Number(v).toFixed(4)} />
                  <ReferenceLine x={0} stroke="var(--chart-muted)" />
                  <Bar
                    isAnimationActive={!reducedMotion}
                    animationDuration={450}
                    dataKey="value"
                    name="HDI difference"
                    radius={4}
                  >
                    {effects.map((e) => (
                      <Cell
                        key={e.key}
                        fill={e.value >= 0 ? "var(--chart-primary)" : "var(--chart-negative)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Input used</th>
                    <th>Value</th>
                    <th>HDI effect</th>
                  </tr>
                </thead>
                <tbody>
                  {effects.map((e) => (
                    <tr key={e.key}>
                      <td>{e.name}</td>
                      <td>{number(baseline[e.key as keyof Inputs], 2)}</td>
                      <td>{signed(e.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="caption">
                These effects are neither SHAP values nor additive
                contributions. Correlated indicators and unrealistic
                combinations can make them misleading. No causal interpretation.
              </p>
            </div>
          </div>
        </Panel>
      </details>
    </>
  );
}
