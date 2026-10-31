import { ArrowUpRight, Info, RotateCcw } from "lucide-react";
import {
  fields,
  validateInputs,
  category,
  dimensions,
  outOfDomain,
} from "../shared/inference.mjs";
import type { Country, Inputs, Model } from "./types";
import type { ReactNode } from "react";

export const number = (v: number, digits = 0) =>
  v.toLocaleString("en-US", { maximumFractionDigits: digits });
export const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(4)}`;
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function CountrySelect({
  countries,
  value,
  onChange,
  label = "Country",
  id,
}: {
  countries: Country[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id: string;
}) {
  return (
    <label className="select-label" htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {[...countries]
          .sort((a, b) => a.country.localeCompare(b.country))
          .map((c) => (
            <option key={c.iso3} value={c.iso3}>
              {c.country}
            </option>
          ))}
      </select>
    </label>
  );
}
export function Badge({ value }: { value: number }) {
  return (
    <span
      className={`badge category-${category(value).toLowerCase().replace(" ", "-")}`}
    >
      {category(value)} development
    </span>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <Info size={17} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function IndicatorForm({
  input,
  onChange,
  prefix,
}: {
  input: Inputs;
  onChange: (input: Inputs) => void;
  prefix: string;
}) {
  const errors = validateInputs(input) as Record<string, string>;
  return (
    <div className="indicator-fields">
      {[
        { name: "Health", keys: ["life_expectancy"] },
        { name: "Education", keys: ["expected_schooling", "mean_schooling"] },
        { name: "Standard of living", keys: ["gni_per_capita"] },
      ].map((group, index) => (
        <fieldset className="indicator-group" key={group.name}>
          <legend>
            <span>0{index + 1}</span>
            {group.name}
          </legend>
          <div className="group-fields">
            {fields
              .filter((f) => group.keys.includes(f.key))
              .map((f) => {
                const key = f.key as keyof Inputs;
                const error = errors[key];
                return (
                  <div className="indicator-field" key={key}>
                    <div className="field-heading">
                      <label htmlFor={`${prefix}-${key}`}>{f.label}</label>
                      <span>{f.unit}</span>
                    </div>
                    <input
                      id={`${prefix}-${key}`}
                      type="number"
                      min={f.min}
                      max={f.max}
                      step="any"
                      value={Number.isFinite(input[key]) ? input[key] : ""}
                      aria-invalid={!!error}
                      aria-describedby={`${prefix}-${key}-hint`}
                      onChange={(e) =>
                        onChange({
                          ...input,
                          [key]:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
                        })
                      }
                    />
                    <input
                      aria-label={`${f.label} slider`}
                      type="range"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={Number.isFinite(input[key]) ? input[key] : f.min}
                      onChange={(e) =>
                        onChange({ ...input, [key]: Number(e.target.value) })
                      }
                    />
                    <p
                      id={`${prefix}-${key}-hint`}
                      className={error ? "field-error" : "field-hint"}
                    >
                      {error || f.description}
                    </p>
                  </div>
                );
              })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
export function DimensionBars({ input }: { input: Inputs }) {
  return (
    <div className="dimension-bars">
      {dimensions(input).map((d) => (
        <div key={d.name}>
          <div>
            <span>{d.name}</span>
            <strong>{d.value.toFixed(3)}</strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${d.value * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
export function Score({
  value,
  label = "Model estimate",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="score result-change" key={value}>
      <span className="eyebrow">{label}</span>
      <div className="score-number">
        {value.toFixed(3)}
        <span>/ 1.000</span>
      </div>
      <Badge value={value} />
      <div className="score-scale">
        <i style={{ left: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </div>
      <div className="scale-labels">
        {[0, 0.55, 0.7, 0.8, 1].map((v) => (
          <span key={v} style={{ left: `${v * 100}%` }}>
            {v === 0 || v === 1 ? v.toFixed(1) : v.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
export function DomainNotice({
  model,
  input,
}: {
  model: Model;
  input: Inputs;
}) {
  const outside = outOfDomain(model, input);
  return outside.length ? (
    <Notice>
      Outside training range: {outside.join(", ")}. Extrapolation is unreliable;
      this estimate may be misleading. Predictions are bounded to the HDI
      interval [0, 1].
    </Notice>
  ) : null;
}
export function Reset({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="button secondary" onClick={onClick}>
      <RotateCcw size={15} />
      Reset
    </button>
  );
}
export function SourceLink() {
  return (
    <a
      className="source-link"
      href="https://hdr.undp.org/data-center/documentation-and-downloads"
      target="_blank"
      rel="noreferrer"
    >
      UNDP · Human Development Report 2025
      <ArrowUpRight size={14} />
    </a>
  );
}
export function downloadJSON(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function presetInputs(c: Inputs): Inputs {
  return {
    life_expectancy: Number(c.life_expectancy.toFixed(2)),
    expected_schooling: Number(c.expected_schooling.toFixed(2)),
    mean_schooling: Number(c.mean_schooling.toFixed(2)),
    gni_per_capita: Number(c.gni_per_capita.toFixed(2)),
  };
}
