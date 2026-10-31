import { ArrowRight, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  predict,
  dimensions,
  validateInputs,
  fields,
} from "../../shared/inference.mjs";
import {
  Notice,
  Panel,
  Reset,
  IndicatorForm,
  Badge,
  DomainNotice,
  number,
  signed,
} from "../components";
import type { Assets, Inputs } from "../types";
import useReducedMotion from "../useReducedMotion";
export default function Scenarios({
  assets,
  baseline,
  scenario,
  setScenario,
  onBaseline,
  onInsights,
}: {
  assets: Assets;
  baseline: Inputs;
  scenario: Inputs;
  setScenario: (v: Inputs) => void;
  onBaseline: () => void;
  onInsights: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const valid = !Object.keys(validateInputs(scenario)).length;
  const base = predict(assets.model, baseline);
  const updated = valid ? predict(assets.model, scenario) : null;
  const bars = dimensions(baseline).map((d, i) => ({
    name: d.name,
    Baseline: d.value,
    Scenario: valid ? dimensions(scenario)[i].value : 0,
  }));
  return (
    <>
      <Notice>
        Hypothetical model comparison, not a causal forecast. The baseline is
        the last calculated predictor inputs (or the initial country preset).
        Changing it resets this scenario.
      </Notice>
      <div className="two-columns scenario-grid">
        <Panel
          title="Change the indicators"
          eyebrow="SCENARIO INPUTS"
          action={<Reset onClick={() => setScenario({ ...baseline })} />}
        >
          <IndicatorForm
            input={scenario}
            onChange={setScenario}
            prefix="scenario"
          />
          <button className="text-button" onClick={onBaseline}>
            Edit the baseline in HDI predictor <ArrowRight size={16} />
          </button>
        </Panel>
        <div className="scenario-results">
          <div className="scenario-score-grid">
            <div className="stat-card">
              <span>Baseline estimate</span>
              <strong>{base.toFixed(3)}</strong>
              <Badge value={base} />
            </div>
            <div className="stat-card highlighted">
              <span>Scenario estimate</span>
              <strong className="result-change" key={updated}>{updated?.toFixed(3) ?? "—"}</strong>
              {updated !== null && <Badge value={updated} />}
            </div>
          </div>
          <div className="delta-card" aria-live="polite">
            <span>Change in predicted HDI</span>
            <strong className="result-change" key={updated}>
              {updated === null ? "Enter valid inputs" : signed(updated - base)}
            </strong>
            <p>
              {updated === null
                ? "Resolve the highlighted inputs to compare."
                : updated === base
                  ? "The model returns the same estimate for these inputs."
                  : `The model estimate is ${updated > base ? "higher" : "lower"} by ${Math.abs(updated - base).toFixed(4)} HDI points. This does not establish that a policy would cause this change.`}
            </p>
          </div>
          <Panel title="Compare the three dimensions">
            {valid ? (
              <div
                className="chart"
                role="img"
                aria-label="Baseline and scenario dimension indices"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bars}>
                    <CartesianGrid vertical={false} strokeDasharray="3 5" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip formatter={(v) => Number(v).toFixed(3)} />
                    <Legend iconType="circle" />
                    <Bar
                      isAnimationActive={!reducedMotion}
                      animationDuration={450}
                      dataKey="Baseline"
                      fill="var(--chart-muted)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      isAnimationActive={!reducedMotion}
                      animationDuration={450}
                      dataKey="Scenario"
                      fill="var(--chart-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Notice>
                Correct the invalid scenario inputs to view the dimension
                comparison.
              </Notice>
            )}
          </Panel>
          {valid && <DomainNotice model={assets.model} input={scenario} />}
        </div>
      </div>
      <Panel
        title="Your scenario, side by side"
        action={
          <button
            className="button secondary"
            disabled={!valid}
            onClick={onInsights}
          >
            <Sparkles size={16} />
            Explain comparison
          </button>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Baseline</th>
                <th>Scenario</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.key}>
                  <td>
                    {f.label} <small>{f.unit}</small>
                  </td>
                  <td>{number(baseline[f.key as keyof Inputs], 2)}</td>
                  <td>
                    {valid ? number(scenario[f.key as keyof Inputs], 2) : "—"}
                  </td>
                  <td>
                    {valid
                      ? number(
                          scenario[f.key as keyof Inputs] -
                            baseline[f.key as keyof Inputs],
                          2,
                        )
                      : "—"}
                  </td>
                </tr>
              ))}
              {bars.map((d) => (
                <tr key={d.name}>
                  <td>{d.name} index</td>
                  <td>{d.Baseline.toFixed(3)}</td>
                  <td>{valid ? d.Scenario.toFixed(3) : "—"}</td>
                  <td>{valid ? signed(d.Scenario - d.Baseline) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
