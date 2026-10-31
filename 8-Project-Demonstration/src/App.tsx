import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import Navbar from "./Navbar";
import { AIProvider, useAI } from "./AIContext";
import AISettings from "./AISettings";
import { SourceLink, presetInputs } from "./components";
import type { Assets, Inputs } from "./types";
import Overview from "./pages/Overview";
import Explorer from "./pages/Explorer";
import Predictor from "./pages/Predictor";
import Scenarios from "./pages/Scenarios";
import Insights from "./pages/Insights";
import EvaluationView from "./pages/EvaluationView";
const pageIds = ["overview", "explore", "predict", "scenarios", "evaluation", "insights"];
const initialPage = () =>
  pageIds.includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "overview";

export default function App() {
  const [assets, setAssets] = useState<Assets | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      ["countries", "model", "evaluation"].map(async (name) => {
        const res = await fetch(`/data/${name}.json`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Could not load ${name}.`);
        return res.json();
      }),
    )
      .then(([countries, model, evaluation]) =>
        setAssets({ countries, model, evaluation }),
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "The verified dataset or model could not be loaded. Check your connection and retry.",
          );
      });
    return () => controller.abort();
  }, []);
  if (!assets)
    return (
      <div className="loading-shell">
        <img src="/hdi-logo.svg" alt="" width="64" height="64"/>
        <h1>HDI Intelligence</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button" onClick={() => location.reload()}>
              Retry loading
            </button>
          </>
        ) : (
          <p role="status">
            <LoaderCircle className="spin" size={18} />
            Loading country data and verified model…
          </p>
        )}
      </div>
    );
  return <AIProvider><Website assets={assets} /></AIProvider>;
}
function Website({ assets }: { assets: Assets }) {
  const { countries } = assets;
  const defaultCountry =
    countries.find((c) => c.iso3 === "IND") || countries[0];
  const [page, setPage] = useState(initialPage);
  const { configured, settingsOpen, openSettings } = useAI();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("hdi-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [preset, setPreset] = useState<Inputs>(presetInputs(defaultCountry));
  const [presetYear, setPresetYear] = useState(2023);
  const [explorerCountry, setExplorerCountry] = useState(defaultCountry.iso3);
  const [country, setCountry] = useState(defaultCountry.iso3);
  const selected = countries.find((c) => c.iso3 === explorerCountry)!;
  const [draft, setDraft] = useState<Inputs>(presetInputs(defaultCountry));
  const [baseline, setBaseline] = useState<Inputs>(
    presetInputs(defaultCountry),
  );
  const [scenario, setScenario] = useState<Inputs>(
    presetInputs(defaultCountry),
  );
  const [ran, setRan] = useState(false);
  useEffect(() => {
    const listener = () => {
      setPage(initialPage());
      setAiOpen(false);
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", listener);
    return () => removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("hdi-theme", dark ? "dark" : "light");
    } catch {
      /* Preferences are optional. */
    }
  }, [dark]);
  const navigate = (id: string) => {
    location.hash = id;
    setPage(id);
    setAiOpen(false);
    window.scrollTo(0, 0);
  };
  const useCountry = (id: string) => {
    const c = countries.find((c) => c.iso3 === id)!;
    setCountry(id);
    setPresetYear(2023);
    setPreset(presetInputs(c));
    setDraft(presetInputs(c));
    setBaseline(presetInputs(c));
    setScenario(presetInputs(c));
    setRan(false);
  };
  const titles: Record<string, [string, string]> = {
    explore: [
      "A world of development, explored.",
      "Compare published country indicators across regions and years.",
    ],
    overview: [
      "Human development, in perspective.",
      "Explore the indicators behind a better quality of life.",
    ],
    predict: [
      "From indicators to insight.",
      "Estimate HDI with a verified machine learning model.",
    ],
    scenarios: [
      "Explore what could change.",
      "Compare hypothetical indicators, one scenario at a time.",
    ],
    insights: [
      "Make the numbers make sense.",
      "Grounded explanations of your model results, powered by Groq.",
    ],
    evaluation: [
      "Evidence behind the estimate.",
      "A transparent look at the data, methodology and model performance.",
    ],
  };
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to main content
      </a>
      <Navbar page={page} dark={dark} onTheme={() => setDark(!dark)} onNavigate={navigate} onSettings={openSettings} configured={configured} />
      <div className="site-content">
        <main id="main-content" tabIndex={-1} key={page}>
          {page !== "overview" && (
            <div className="page-heading">
              <div>
                <div className="eyebrow page-kicker">HUMAN DEVELOPMENT, IN FOCUS</div>
                <h1>{titles[page][0]}</h1>
                <p>{titles[page][1]}</p>
              </div>
            </div>
          )}
          {page === "overview" && (
            <Overview
              assets={assets}
              selected={selected}
              onSelect={setExplorerCountry}
              onPredict={() => {
                useCountry(explorerCountry);
                navigate("predict");
              }}
            />
          )}
          {page === "explore" && (
            <Explorer
              assets={assets}
              selected={selected}
              onSelect={setExplorerCountry}
              onPreset={(input, id, year) => {
                setCountry(id);
                setPresetYear(year);
                setPreset(presetInputs(input));
                setDraft(presetInputs(input));
                setBaseline(presetInputs(input));
                setScenario(presetInputs(input));
                setRan(false);
                navigate("predict");
              }}
            />
          )}
          {page === "predict" && (
            <Predictor
              assets={assets}
              country={country}
              presetYear={presetYear}
              preset={preset}
              onCountry={useCountry}
              draft={draft}
              setDraft={setDraft}
              baseline={baseline}
              ran={ran}
              onRun={() => {
                setBaseline({ ...draft });
                setScenario({ ...draft });
                setRan(true);
              }}
              onScenario={() => navigate("scenarios")}
              onInsights={() => {
                setAiOpen(true);
                setTimeout(
                  () =>
                    document
                      .getElementById("ai-context")
                      ?.scrollIntoView({ behavior: "instant", block: "start" }),
                  0,
                );
              }}
            />
          )}
          {page === "scenarios" && (
            <Scenarios
              assets={assets}
              baseline={baseline}
              scenario={scenario}
              setScenario={setScenario}
              onBaseline={() => navigate("predict")}
              onInsights={() => {
                setAiOpen(true);
                setTimeout(
                  () =>
                    document
                      .getElementById("ai-context")
                      ?.scrollIntoView({ behavior: "instant", block: "start" }),
                  0,
                );
              }}
            />
          )}
          {aiOpen && (page === "predict" || page === "scenarios") && (
            <section id="ai-context" aria-label="Contextual AI explanation">
              <button className="text-button" onClick={() => setAiOpen(false)}>
                Close explanation panel <X size={16} />
              </button>
              <Insights
                key={JSON.stringify([baseline, scenario])}
                assets={assets}
                baseline={baseline}
                scenario={page === "scenarios" ? scenario : baseline}
              />
            </section>
          )}
          {page === "insights" && (
            <Insights assets={assets} baseline={baseline} scenario={scenario} />
          )}
          {page === "evaluation" && <EvaluationView assets={assets} />}
        </main>
      </div>
      <footer className="site-footer">
        <a className="footer-brand" href="#overview"><img src="/hdi-logo.svg" alt="" width="30" height="30" />HDI Intelligence</a>
        <SourceLink />
      </footer>
      {settingsOpen && <AISettings />}
    </>
  );
}
