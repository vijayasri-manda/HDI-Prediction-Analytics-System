import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useId } from "react";
import { Notice, SourceLink } from "./components";
import type { Country } from "./types";
import useReducedMotion from "./useReducedMotion";
export default function Trend({
  selected,
  other,
  throughYear,
}: {
  selected: Country;
  other?: Country;
  throughYear?: number;
}) {
  const reducedMotion = useReducedMotion();
  const gradientId = useId();
  const comparisonCountry = other?.iso3 === selected.iso3 ? undefined : other;
  const records = [...selected.history, ...(comparisonCountry?.history || [])];
  const validYears = records.map((h) => h.year).filter(Number.isInteger);
  const first = Math.min(1990, ...validYears);
  const last = throughYear ?? 2023;
  const valueAt = (country: Country | undefined, year: number) => {
    const value = country?.history.find((h) => h.year === year)?.hdi;
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
  };
  // Include every calendar year so absent observations remain visible gaps.
  const data = Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => ({
    year: first + i,
    selected: valueAt(selected, first + i),
    comparison: valueAt(comparisonCountry, first + i),
  }));
  const selectedCount = data.filter((d) => d.selected !== null).length;
  const comparisonCount = data.filter((d) => d.comparison !== null).length;
  return (
    <>
      <p className="caption">Published HDI, {first}–{last}. {throughYear !== undefined && "The year selector shows history through that year. "}Gaps mean no published observation; values are never interpolated.</p>
      {(selectedCount < data.length || (comparisonCountry && comparisonCount < data.length)) && (
        <Notice>{selected.country}: {selectedCount} of {data.length} observations{comparisonCountry ? `; ${comparisonCountry.country}: ${comparisonCount} of ${data.length}` : ""}. Missing years are listed as unavailable below.</Notice>
      )}
      {!selectedCount && !comparisonCount ? <Notice>No historical observations are available for this selection.</Notice> :
      <div
        className="chart large-chart"
        role="img"
        aria-label={`Published HDI through ${last} for ${selected.country}${comparisonCountry ? ` and ${comparisonCountry.country}` : ""}. Exact values below.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 12, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 5" />
            <XAxis
              dataKey="year"
              minTickGap={35}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v) => Number(v).toFixed(3)} />
            <Area
              dataKey="selected"
              name={selected.country}
              stroke="var(--chart-primary)"
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              connectNulls={false}
              dot={{ r: 2, strokeWidth: 0, fill: "var(--chart-primary)" }}
              isAnimationActive={!reducedMotion}
              animationDuration={450}
            />
            {comparisonCountry && (
              <Area
                dataKey="comparison"
                name={comparisonCountry.country}
                stroke="var(--chart-secondary)"
                strokeWidth={3}
                strokeDasharray="6 4"
                fill="transparent"
                connectNulls={false}
                dot={{ r: 2, strokeWidth: 0, fill: "var(--chart-secondary)" }}
                isAnimationActive={!reducedMotion}
                animationDuration={450}
              />
            )}
            <Legend iconType="line" />
          </AreaChart>
        </ResponsiveContainer>
      </div>}
      <SourceLink />
      <details className="chart-data">
        <summary>View trend data</summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Historical HDI values"
        >
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>{selected.country}</th>
                {comparisonCountry && <th>{comparisonCountry.country}</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.year}>
                  <td>{d.year}</td>
                  <td>{d.selected?.toFixed(3) ?? "Not available"}</td>
                  {comparisonCountry && (
                    <td>{d.comparison?.toFixed(3) ?? "Not available"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
