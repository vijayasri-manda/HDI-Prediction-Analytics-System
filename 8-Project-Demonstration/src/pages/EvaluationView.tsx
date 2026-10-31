import { ShieldCheck, Download } from "lucide-react";
import {
  Scatter,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { fields } from "../../shared/inference.mjs";
import { Panel, Notice, SourceLink, number } from "../components";
import type { Assets } from "../types";
import useReducedMotion from "../useReducedMotion";
const colors = ["var(--chart-primary)", "var(--chart-secondary)", "var(--chart-warning)", "var(--chart-negative)"];
export default function EvaluationView({ assets }: { assets: Assets }) {
  const reducedMotion = useReducedMotion();
  const { evaluation: e } = assets;
  return (
    <>
      <div className="source-banner">
        <div>
          <ShieldCheck size={18} />
          <strong>{e.name}</strong>
          <span>
            Selected using country-disjoint validation · Reproducible seed 42
          </span>
        </div>
        <a className="text-button" href="/data/evaluation.json" download>
          <Download size={15} />
          Download evidence
        </a>
      </div>
      <div className="stats-grid">
        {[
          {
            label: "Held-out MAE",
            value: e.test.mae.toFixed(4),
            sub: "Average absolute error in HDI points; lower is better.",
          },
          {
            label: "Held-out RMSE",
            value: e.test.rmse.toFixed(4),
            sub: "Error measure that gives larger mistakes more weight.",
          },
          {
            label: "Held-out R²",
            value: e.test.r2.toFixed(4),
            sub: "Variation explained on unseen countries; not percentage accuracy.",
          },
          {
            label: "Complete country-years",
            value: number(e.rows),
            sub: `${e.countries} countries · 1990–2023`,
          },
        ].map((m) => (
          <div className="stat-card" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
            <small>{m.sub}</small>
          </div>
        ))}
      </div>
      <Notice>
        <strong>Strong reconstruction scores are expected.</strong> The target
        HDI is defined by the same health, schooling and income inputs. The
        formula reference has MAE {e.formula.mae.toFixed(5)} on the same test
        rows. ML is an educational approximation, not evidence of forecasting
        skill.
      </Notice>
      <div className="two-columns">
        <Panel
          title="How the model was selected"
          eyebrow="VALIDATION SET · UNSEEN COUNTRIES"
        >
          <p className="panel-description">
            Four algorithms were compared on countries excluded from training.
            Linear regression had the lowest validation error and was refitted
            before the final test.
          </p>
          <div
            className="model-comparison"
            aria-label="Validation mean absolute error; lower is better"
          >
            {[...e.comparison]
              .sort((a, b) => a.mae - b.mae)
              .map((m) => (
                <div key={m.name}>
                  <div>
                    <span>{m.name}</span>
                    <strong>{m.mae.toFixed(4)}</strong>
                  </div>
                  <div className="bar-track">
                    <span
                      style={{
                        width: `${(m.mae / Math.max(...e.comparison.map((x) => x.mae))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <details className="chart-data">
            <summary>All model comparison metrics</summary>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Model comparison metrics"
            >
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>MAE</th>
                    <th>RMSE</th>
                    <th>R²</th>
                  </tr>
                </thead>
                <tbody>
                  {[...e.comparison]
                    .sort((a, b) => a.mae - b.mae)
                    .map((m) => (
                      <tr
                        key={m.name}
                        className={m.name === e.name ? "selected-row" : ""}
                      >
                        <td>
                          <strong>{m.name}</strong>
                          {m.name === e.name && (
                            <small>Selected by validation MAE</small>
                          )}
                        </td>
                        <td>{m.mae.toFixed(4)}</td>
                        <td>{m.rmse.toFixed(4)}</td>
                        <td>{m.r2.toFixed(4)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="caption">
            {e.selection} Test metrics above belong only to the selected,
            refitted model.
          </p>
          <div className="split-bars">
            {[
              ["Train", e.split.train],
              ["Validation", e.split.validation],
              ["Test", e.split.test],
            ].map(([label, value], i) => (
              <div key={label} style={{ borderTopColor: colors[i] }}>
                <strong>{number(Number(value))}</strong>
                <span>{label} rows</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Predicted against published HDI"
          eyebrow="HELD-OUT COUNTRIES · EVERY FIFTH ROW"
        >
          <div
            className="chart"
            role="img"
            aria-label="Held-out published versus predicted HDI scatter plot"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 5" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Published HDI"
                  domain={[0, 1]}
                  label={{
                    value: "Published HDI",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="Predicted HDI"
                  domain={[0, 1]}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <ReferenceLine
                  segment={[
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                  ]}
                  stroke="var(--chart-muted)"
                  strokeDasharray="4 4"
                />
                <Scatter
                  isAnimationActive={!reducedMotion}
                  animationDuration={450}
                  name="Held-out samples"
                  data={e.residuals}
                  fill="var(--chart-primary)"
                  fillOpacity={0.55}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="caption">
            Diagonal represents a perfect reconstruction. Numeric samples are
            included in the downloadable evaluation evidence.
          </p>
        </Panel>
      </div>
      <div className="two-columns">
        <Panel
          title="Which inputs does the estimator rely on?"
          eyebrow="HELD-OUT PERMUTATION IMPORTANCE"
        >
          <p className="panel-description">
            Increase in test MAE after shuffling one feature. Eight repeats;
            larger values indicate greater model reliance. Correlation limits
            interpretation.
          </p>
          <div className="importance-list">
            {[...e.importance]
              .sort((a, b) => b.value - a.value)
              .map((i) => (
                <div key={i.feature}>
                  <div>
                    <span>
                      {fields.find((f) => f.key === i.feature)?.label}
                    </span>
                    <strong>
                      {i.value.toFixed(4)} <small>± {i.std.toFixed(4)}</small>
                    </strong>
                  </div>
                  <div className="bar-track">
                    <span
                      style={{
                        width: `${(Math.max(0, i.value) / Math.max(...e.importance.map((x) => x.value))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Data and reproducibility" eyebrow="METHOD CARD">
          <dl className="method-list">
            <div>
              <dt>Source</dt>
              <dd>UNDP HDR 2025 · 2021 PPP income</dd>
            </div>
            <div>
              <dt>Preprocessing</dt>
              <dd>
                Complete cases; natural log of GNI. Other inputs unchanged.
              </dd>
            </div>
            <div>
              <dt>Formula reference</dt>
              <dd>
                Health, education and logarithmic income indices combined using
                their geometric mean. A direct calculation from known inputs,
                not a forecast.
              </dd>
            </div>
            <div>
              <dt>Excluded rows</dt>
              <dd>
                {number(e.droppedRows)} incomplete country-years; regional
                aggregates excluded.
              </dd>
            </div>
            <div>
              <dt>Inference</dt>
              <dd>
                Exported estimator evaluated in JavaScript;{" "}
                {number(e.parityCases)} Python reference cases.
              </dd>
            </div>
            <div>
              <dt>Time holdout</dt>
              <dd>
                Train through 2018, test 2019–2023: MAE{" "}
                {e.temporal.mae.toFixed(4)}, RMSE {e.temporal.rmse.toFixed(4)},
                R² {e.temporal.r2.toFixed(4)}.
              </dd>
            </div>
          </dl>
          <p className="caption">
            Temporal testing uses same-year inputs, not predictions of unknown
            future indicators. Data revisions can affect all years.
          </p>
        </Panel>
      </div>
      <details className="technical-details">
        <summary>Research history, synthetic-data audit & limitations</summary>
        <Panel
          title="What changed from the original experiment"
          eyebrow="SYNTHETIC PIPELINE AUDIT"
        >
          <p className="panel-description">
            The original 1,500-row panel contains invented peers and
            formula-derived targets with added noise. Random row splitting
            shares related country families across sets. The audit below
            retrains a four-component Extra Trees comparator; it does not claim
            to reproduce the original eight-feature pickle.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Synthetic audit experiment</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>R²</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(e.syntheticAudit).map(([name, m]) => (
                  <tr key={name}>
                    <td>
                      {name === "randomSplit"
                        ? "Random row split"
                        : name === "familyGroupedSplit"
                          ? "Country-family grouped split"
                          : "Direct formula reference (all synthetic rows)"}
                    </td>
                    <td>{m.mae.toFixed(4)}</td>
                    <td>{m.rmse.toFixed(4)}</td>
                    <td>{m.r2.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="limitation-list">
            {e.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <SourceLink />
        </Panel>
      </details>
    </>
  );
}
