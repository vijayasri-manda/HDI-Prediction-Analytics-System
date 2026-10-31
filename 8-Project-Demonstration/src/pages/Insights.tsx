import { useEffect, useRef, useState } from "react";
import { Sparkles, LoaderCircle, KeyRound } from "lucide-react";
import {
  predict,
  validateInputs,
  formulaHDI,
} from "../../shared/inference.mjs";
import { Panel, Score, DimensionBars, Notice, signed } from "../components";
import type { Assets, Inputs } from "../types";
import Explanation from "../Explanation";
import { useAI } from "../AIContext";
import type { AIStatus } from "../AIContext";
const failures: Record<string, [string, AIStatus]> = {
  missing_api_key: ["Add your personal Groq key in AI Settings to generate an explanation.", "unconfigured"],
  malformed_api_key: ["The key format is not recognized. Replace it in AI Settings.", "invalid"],
  invalid_api_key: ["Groq did not accept this key. Check or replace it in AI Settings.", "invalid"],
  quota_exceeded: ["Your Groq account has reached its quota. Check your account before trying again.", "limited"],
  rate_limited: ["The request limit was reached. Wait before trying again, or check your Groq account limits.", "limited"],
  provider_timeout: ["Groq took too long to respond. Please try again later.", "unavailable"],
  provider_unavailable: ["Groq is temporarily unavailable. Please try again later.", "unavailable"],
  ai_not_configured: ["AI is not configured on this deployment. Your numerical tools remain available.", "unavailable"],
};
export default function Insights({
  assets,
  baseline,
  scenario,
}: {
  assets: Assets;
  baseline: Inputs;
  scenario: Inputs;
}) {
  const [question, setQuestion] = useState(
    "Explain my baseline HDI estimate and the main limitations.",
  );
  const { configured, revision, openSettings, startRequest, markStatus } = useAI();
  const activeRequest = useRef<AbortController | null>(null);
  const [include, setInclude] = useState(
    JSON.stringify(baseline) !== JSON.stringify(scenario) &&
      !Object.keys(validateInputs(scenario)).length,
  );
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAnswer("");
    setError("");
    setBusy(false);
    return () => { activeRequest.current?.abort(); };
  }, [revision]);
  const scenarioValid = !Object.keys(validateInputs(scenario)).length;
  const base = predict(assets.model, baseline);
  async function ask() {
    if (busy || !question.trim() || (include && !scenarioValid)) return;
    if (!configured) { openSettings(); return; }
    const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname);
    if (location.protocol !== "https:" && !local) {
      setError("Open this site over HTTPS before sending a personal API key.");
      return;
    }
    const request = startRequest();
    if (!request.key) { request.release(); openSettings(); return; }
    activeRequest.current = request.controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      request.controller.abort();
    }, 20000);
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Groq-API-Key": request.key,
        },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify({
          baseline,
          ...(include ? { scenario } : {}),
          question,
        }),
        signal: request.controller.signal,
      });
      const data = await res.json();
      if (request.controller.signal.aborted) return;
      if (!res.ok) {
        const [message, status] = failures[data.code] || ["The explanation could not be completed. Try again later; your HDI tools remain available.", "unavailable"];
        markStatus(status as AIStatus, request.revision);
        setError(message);
        return;
      }
      if (typeof data.explanation !== "string" || !data.explanation.trim() || data.explanation.length > 12000)
        throw new Error("Invalid response");
      markStatus("connected", request.revision);
      setAnswer(data.explanation);
    } catch {
      if (request.controller.signal.aborted && !timedOut) return;
      markStatus("unavailable", request.revision);
      setError(timedOut ? "The explanation timed out. Please try again later." : "Could not reach the AI service. Check your connection and try again.");
    } finally {
      window.clearTimeout(timeout);
      request.release();
      if (activeRequest.current === request.controller) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <div className="two-columns insights-grid">
      <Panel
        title="A little context goes a long way"
        eyebrow="GROQ AI EXPLANATIONS"
        action={<Sparkles className="teal" size={23} />}
      >
        <p className="panel-description">
          Ask about your current indicators and results. The
          server calculates the model outputs again before requesting an
          explanation.
        </p>
        <div className="prompt-chips">
          {[
            "Explain my baseline HDI estimate and the main limitations.",
            "How do health, education and income contribute to HDI?",
            "What can and cannot be concluded from this scenario?",
          ].map((q, i) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q);
                if (i === 2 && scenarioValid) setInclude(true);
              }}
            >
              {
                [
                  "Explain my prediction",
                  "Summarize the indicators",
                  "Explain the scenario difference",
                ][i]
              }
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <label className="text-label" htmlFor="ai-question">
            Your question
          </label>
          <textarea
            id="ai-question"
            rows={4}
            maxLength={500}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="question-meta">
            <label>
              <input
                type="checkbox"
                checked={include}
                disabled={!scenarioValid}
                onChange={(e) => setInclude(e.target.checked)}
              />
              Include current scenario
            </label>
            <span>{question.length}/500</span>
          </div>
          <div className="ai-key-prompt">
            <p>{configured ? "Your personal key is available for this tab." : "Add your personal Groq key to use AI explanations."}</p>
            <button type="button" className="text-button" onClick={openSettings}><KeyRound size={16} /> AI Settings</button>
          </div>
          <button
            className="button"
            disabled={!configured || busy || !question.trim() || (include && !scenarioValid)}
            type="submit"
          >
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Sparkles size={17} />
            )}{" "}
            {busy ? "Preparing an explanation…" : "Generate explanation"}
          </button>
        </form>
        <div aria-live="polite" aria-busy={busy}>
          {!answer && !error && !busy && (
            <p className="ai-empty">
              Choose a question, then generate an explanation of the displayed
              results. Your key, four inputs and question pass through this site's
              backend to Groq only when you generate an explanation.
            </p>
          )}
          {error && (
            <div className="ai-error" role="alert">
              {error}
              <p>
                Your predictions remain available. The local summary alongside
                this panel does not depend on Groq.
              </p>
            </div>
          )}
          {answer && (
            <div className="ai-answer">
              <span className="eyebrow">
                AI-GENERATED EXPLANATION · CHECK AGAINST RESULTS
              </span>
              <Explanation text={answer} />
            </div>
          )}
        </div>
      </Panel>
      <Panel
        title="The evidence in your question"
        eyebrow="LOCAL MODEL SUMMARY"
      >
        <Score value={base} />
        <DimensionBars input={baseline} />
        <p className="panel-description">
          This {assets.model.name} estimate is reconstructed from your four
          indicators. The direct formula gives{" "}
          <strong>{formulaHDI(baseline).toFixed(3)}</strong>.
        </p>
        {include && scenarioValid && (
          <div className="formula-comparison">
            <span>Scenario difference</span>
            <strong>{signed(predict(assets.model, scenario) - base)}</strong>
          </div>
        )}
        <Notice>
          AI text can contain errors. It cannot establish causality, predict
          policy outcomes or supply a verified confidence interval. The server
          recomputes the displayed inputs and results before asking Groq.
        </Notice>
        <p className="caption">
          No API key is required for analytics or predictions. AI explanations
          use your own Groq account and depend on its limits and service availability.
        </p>
      </Panel>
    </div>
  );
}
