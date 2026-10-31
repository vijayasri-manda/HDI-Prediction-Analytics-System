import { useEffect, useState } from "react";
import { ArrowRight, Download, Search } from "lucide-react";
import { fields, category } from "../../shared/inference.mjs";
import {
  Badge,
  CountrySelect,
  DimensionBars,
  Notice,
  Panel,
  Score,
  SourceLink,
  downloadJSON,
  number,
} from "../components";
import Trend from "../Trend";
import type { Assets, Country, Inputs } from "../types";
type RecordRow = Inputs & { iso3: string; year: number; hdi: number };
export default function Explorer({
  assets,
  selected,
  onSelect,
  onPreset,
}: {
  assets: Assets;
  selected: Country;
  onSelect: (id: string) => void;
  onPreset: (input: Inputs, iso3: string, year: number) => void;
}) {
  const [rows, setRows] = useState<RecordRow[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [year, setYear] = useState(2023);
  const [region, setRegion] = useState("All regions");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All categories");
  const [compare, setCompare] = useState("CHN");
  useEffect(() => {
    const abort = new AbortController();
    fetch("/data/explorer.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error("Historical indicators could not be loaded.");
        return r.json();
      })
      .then(setRows)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [attempt]);
  const countries = assets.countries;
  const options = countries.filter(
    (c) => region === "All regions" || c.region === region,
  );
  const other = countries.find((c) => c.iso3 === compare)!;
  const current = rows?.find(
    (r) => r.iso3 === selected.iso3 && r.year === year,
  );
  const comparison = rows?.find((r) => r.iso3 === compare && r.year === year);
  const filtered = (rows || [])
    .filter((r) => r.year === year)
    .map((r) => ({ ...countries.find((c) => c.iso3 === r.iso3)!, ...r }))
    .filter(
      (c) =>
        (region === "All regions" || c.region === region) &&
        (c.country.toLowerCase().includes(search.toLowerCase()) ||
          c.iso3.toLowerCase().includes(search.toLowerCase())) &&
        (tier === "All categories" || category(c.hdi) === tier),
    )
    .sort((a, b) => b.hdi - a.hdi);
  if (!rows)
    return (
      <Panel title="Historical country indicators">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="button"
              onClick={() => {
                setError("");
                setAttempt((a) => a + 1);
              }}
            >
              Retry historical data
            </button>
          </>
        ) : (
          <p role="status">Loading historical indicators…</p>
        )}
      </Panel>
    );
  return (
    <>
      <Panel
        title="Choose your perspective"
        eyebrow="PUBLISHED OBSERVATIONS · UNDP HDR 2025"
      >
        <div className="explorer-filters">
          <label className="select-label">
            Region
            <select
              aria-label="Region"
              value={region}
              onChange={(e) => {
                const next = e.target.value;
                setRegion(next);
                const available = countries.filter(
                  (c) => next === "All regions" || c.region === next,
                );
                if (!available.some((c) => c.iso3 === selected.iso3))
                  onSelect(available[0].iso3);
              }}
            >
              {["All regions", ...new Set(countries.map((c) => c.region))].map(
                (r) => (
                  <option key={r}>{r}</option>
                ),
              )}
            </select>
          </label>
          <CountrySelect
            id="explorer-country"
            countries={options}
            value={selected.iso3}
            onChange={onSelect}
            label="Explore country"
          />
          <label className="select-label">
            Observation year
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 34 }, (_, i) => 2023 - i).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <CountrySelect
            id="compare-country"
            countries={countries}
            value={compare}
            onChange={setCompare}
            label="Compare with"
          />
        </div>
        <p className="caption">
          Regions follow the source grouping; “Other / not assigned” includes
          countries outside those regional groups. Missing complete records are
          never replaced with another year.
        </p>
      </Panel>
      <div className="overview-grid">
        <Panel
          title={`${selected.country} & ${other.country}`}
          eyebrow="HDI THROUGH TIME"
        >
          <Trend selected={selected} other={other} throughYear={year} />
          <div className="comparison-pair">
            <div>
              <span>
                {selected.country} · {year}
              </span>
              <strong>{current?.hdi.toFixed(3) ?? "Not available"}</strong>
            </div>
            <div>
              <span>
                {other.country} · {year}
              </span>
              <strong>{comparison?.hdi.toFixed(3) ?? "Not available"}</strong>
            </div>
          </div>
        </Panel>
        <Panel
          title={`${selected.country} · ${year}`}
          eyebrow="PUBLISHED COUNTRY INDICATORS"
          className="spotlight"
        >
          {current ? (
            <>
              <Score value={current.hdi} label="Published HDI" />
              <DimensionBars input={current} />
              <dl className="indicator-summary">
                {fields.map((f) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>
                      {number(current[f.key as keyof Inputs], 2)}{" "}
                      <small>{f.unit}</small>
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                className="text-button"
                onClick={() => onPreset(current, selected.iso3, year)}
              >
                Use these indicators <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <Notice>
              No complete indicator record is available for {selected.country}{" "}
              in {year}. Select another year to explore these indicators.
            </Notice>
          )}
        </Panel>
      </div>
      <Panel
        title="The data behind the view"
        eyebrow={`COMPLETE COUNTRY RECORDS · ${year}`}
        action={
          <button
            className="button secondary compact"
            onClick={() =>
              downloadJSON(
                {
                  source: assets.evaluation.source,
                  year,
                  region,
                  category: tier,
                  search,
                  data: filtered.map(({ history: _history, ...c }) => {
                    void _history;
                    return c;
                  }),
                },
                `hdi-published-data-${year}.json`,
              )
            }
          >
            <Download size={16} />
            Export filtered data
          </button>
        }
      >
        <div className="table-controls">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Search countries"
              placeholder="Search country or ISO code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Development category"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            {["All categories", "Very high", "High", "Medium", "Low"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
          <span className="caption" role="status">
            {filtered.length} results
          </span>
        </div>
        <div
          className="table-scroll country-table"
          tabIndex={0}
          role="region"
          aria-label="Country indicators"
        >
          <table>
            <thead>
              <tr>
                <th>Country / territory</th>
                <th>HDI</th>
                <th>Classification</th>
                {fields.map((f) => (
                  <th key={f.key}>
                    {f.label}
                    <br />
                    {f.unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.iso3}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => {
                        onSelect(c.iso3);
                        document.getElementById("explorer-country")?.focus();
                      }}
                    >
                      {c.country}
                    </button>
                    <small>{c.iso3}</small>
                  </td>
                  <td className="table-score">{c.hdi.toFixed(3)}</td>
                  <td>
                    <Badge value={c.hdi} />
                  </td>
                  {fields.map((f) => (
                    <td key={f.key}>{number(c[f.key as keyof Inputs], 2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="empty-state">
              No countries match these filters. Try another name, year, region
              or category.
            </p>
          )}
        </div>
        <p className="caption">
          Only complete indicator records are listed. GNI is in constant 2021
          PPP dollars. HDI categories: low below 0.550; medium 0.550–0.699; high
          0.700–0.799; very high from 0.800.
        </p>
        <SourceLink />
      </Panel>
    </>
  );
}
