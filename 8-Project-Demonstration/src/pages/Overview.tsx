import {
  ArrowRight,
  MoveUpRight,
} from "lucide-react";
import { Badge, CountrySelect, DimensionBars, Panel, number } from "../components";
import Trend from "../Trend";
import type { Assets, Country } from "../types";

function DimensionIcon({ kind }: { kind: number }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 0 ? <>
        <path d="M16 27S4 20 4 11a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 9-12 16-12 16Z" />
        <path d="M4 16h6l3-5 4 10 3-5h8" />
      </> : kind === 1 ? <>
        <path d="M16 9C12 6 7 6 3 8v17c4-2 9-2 13 1 4-3 9-3 13-1V8c-4-2-9-2-13 1Z" />
        <path d="M16 9v17M7 12h5M7 16h5M21 12h4M21 16h4" />
      </> : <>
        <path d="m4 16 12-9 12 9M7 14v13h18V14M13 27v-8h6v8" />
        <path d="M20 7V4h5v7M3 27h26" />
      </>}
    </svg>
  );
}
export default function Overview({
  assets,
  selected,
  onSelect,
  onPredict,
}: {
  assets: Assets;
  selected: Country;
  onSelect: (id: string) => void;
  onPredict: () => void;
}) {
  const dimensions = [
    {
      name: "A long, healthy life",
      category: "01 / HEALTH",
      text: "Life expectancy at birth captures the health dimension.",
    },
    {
      name: "The opportunity to learn",
      category: "02 / EDUCATION",
      text: "Expected and mean years of schooling describe access to knowledge.",
    },
    {
      name: "A decent standard of living",
      category: "03 / INCOME",
      text: "GNI per person reflects the resources available to support everyday life.",
    },
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THREE DIMENSIONS. A WORLD OF POSSIBILITY.</span>
          <h1>
            Human Development,
            <br />
            <em>Powered by Data.</em>
          </h1>
          <p>
            The Human Development Index brings health, education and income into
            one measure, from 0 to 1. A higher score reflects stronger
            achievement across these dimensions.
          </p>
          <p className="hero-secondary">
            Explore real country data, estimate HDI and ask what changes when
            the indicators change.
          </p>
          <div className="hero-actions">
            <button className="button" onClick={onPredict}>
              Predict HDI <MoveUpRight size={18} />
            </button>
            <a className="button hero-outline" href="#explore">
              Explore Global Data <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <div className="hero-data-card">
          <div className="hero-visual-top">
            <span className="eyebrow">A REAL COUNTRY. A FULLER PICTURE.</span>
            <img src="/hdi-logo.svg" width="42" height="42" alt="" />
          </div>
          <h2 className="hero-hdi-country">{selected.country}</h2>
          <div className="hero-hdi-value">{selected.hdi.toFixed(3)}<span>/ 1.000</span></div>
          <p className="hero-hdi-caption">Published HDI · {selected.year}</p>
          <Badge value={selected.hdi} />
          <div className="hero-dimension-bars"><DimensionBars input={selected} /></div>
          <span className="hero-footnote">
            Dimension indices calculated from the published indicators. Source: UNDP HDR 2025.
          </span>
        </div>
      </section>
      <div className="dataset-strip" aria-label="Dataset coverage">
        <div>
          <strong>{number(assets.countries.length)}</strong>
          <span>countries & territories</span>
        </div>
        <div>
          <strong>{number(assets.evaluation.rows)}</strong>
          <span>complete country-year records</span>
        </div>
        <div>
          <strong>1990–2023</strong>
          <span>historical observations</span>
        </div>
        <div>
          <strong>4 indicators</strong>
          <span>three human dimensions</span>
        </div>
      </div>
      <section className="dimension-intro">
        <div className="section-intro">
          <span className="eyebrow">BEYOND ECONOMIC GROWTH</span>
          <h2>What makes a life better?</h2>
          <p>
            HDI offers a broader view of development. It is an average, so it
            does not capture every inequality or lived experience.
          </p>
        </div>
        <div className="dimension-cards">
          {dimensions.map((d, index) => (
            <article key={d.name}>
              <DimensionIcon kind={index} />
              <span className="eyebrow">{d.category}</span>
              <h3>{d.name}</h3>
              <p>{d.text}</p>
            </article>
          ))}
        </div>
      </section>
      <Panel
        title="Every country has a story."
        eyebrow="EXPLORE THE PUBLISHED RECORD"
        className="home-trend"
        action={
          <a className="text-button" href="#explore">
            Open data explorer <ArrowRight size={16} />
          </a>
        }
      >
        <div className="trend-intro">
          <div>
            <p className="panel-description">
              Follow human development over time. These are published
              observations, not model predictions.
            </p>
            <CountrySelect
              id="home-country"
              label="Choose a country"
              countries={assets.countries}
              value={selected.iso3}
              onChange={onSelect}
            />
          </div>
          <div className="trend-current">
            <span>{selected.country} · 2023</span>
            <strong>{selected.hdi.toFixed(3)}</strong>
            <small>Published HDI / 1.000</small>
          </div>
        </div>
        <Trend selected={selected} />
      </Panel>
      <section className="next-step">
        <div>
          <span className="eyebrow">FROM OBSERVATION TO EXPLORATION</span>
          <h2>What could different indicators mean?</h2>
          <p>
            Start with real indicators. Make an estimate. Explore a hypothetical
            scenario.
          </p>
        </div>
        <button className="button" onClick={onPredict}>
          Try the HDI predictor <ArrowRight size={18} />
        </button>
      </section>
    </>
  );
}
