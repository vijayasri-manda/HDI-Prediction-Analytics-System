import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Eye, EyeOff, KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { useAI } from "./AIContext";
import type { AIStatus } from "./AIContext";
import useReducedMotion from "./useReducedMotion";

const messages: Record<AIStatus, [string, string]> = {
  unconfigured: ["No personal key configured", "Add a key to use AI explanations. All data tools and predictions work without one."],
  configured: ["Key saved for this tab", "Not verified yet. Your connection is checked when you generate an explanation."],
  connected: ["Connected to Groq", "Your most recent AI request succeeded with this key."],
  invalid: ["Key was not accepted", "Replace your key with an active Groq API key, then try an explanation again."],
  limited: ["Request limit reached", "Wait before trying again, or check your Groq quota. Your key is still saved for this tab."],
  unavailable: ["Connection unavailable", "The last request could not be completed. This does not confirm whether your key is valid."],
};

export default function AISettings() {
  const { configured, status, closeSettings, saveKey, clearKey } = useAI();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(!configured);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const reducedMotion = useReducedMotion();
  const dismiss = () => {
    if (closing) return;
    if (reducedMotion) { closeSettings(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(closeSettings, 160);
  };
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(closeTimer.current);
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => { if (editing) input.current?.focus(); }, [editing]);
  const remove = () => {
    clearKey();
    setDraft("");
    setVisible(false);
    setError("");
    setEditing(true);
  };

  return (
    <dialog ref={dialog} className={`ai-settings-dialog${closing ? " is-closing" : ""}`} aria-labelledby="ai-settings-title"
      aria-describedby="ai-settings-description" onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className="ai-settings-card">
        <div className="settings-heading">
          <div><span className="eyebrow"><KeyRound size={16} /> YOUR PERSONAL CONNECTION</span>
            <h2 id="ai-settings-title">AI Settings</h2>
            <p id="ai-settings-description">Bring your Groq key for explanations grounded in your HDI results.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close AI Settings" onClick={dismiss}><X size={21} /></button>
        </div>
        <div className="settings-status" data-status={status} role="status">
          <strong>{messages[status][0]}</strong><p>{messages[status][1]}</p>
        </div>
        {editing ? (
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!saveKey(draft)) {
              setError("Enter a Groq key beginning with gsk_ (24–256 letters, numbers, underscores or hyphens). Copy it from your Groq account.");
              return;
            }
            setDraft(""); setVisible(false); setError(""); setEditing(false);
          }}>
            <label className="key-field" htmlFor="personal-groq-key">{configured ? "Replace your Groq API key" : "Your Groq API key"}</label>
            <div className="input-wrap">
              <input ref={input} id="personal-groq-key" type={visible ? "text" : "password"} value={draft}
                onChange={(event) => { setDraft(event.target.value); setError(""); }}
                autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="gsk_…" maxLength={512} required aria-invalid={!!error}
                aria-describedby={error ? "key-error key-privacy" : "key-privacy"} />
              <button type="button" className="icon-button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide API key" : "Show API key"}>
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {error && <p id="key-error" className="settings-error" role="alert">{error}</p>}
            <div className="settings-actions">
              <button type="submit" className="button" disabled={!draft.trim()}><Check size={17} /> Use key for this tab</button>
              {configured && <button type="button" className="button secondary" onClick={() => { setDraft(""); setVisible(false); setError(""); setEditing(false); }}>Cancel change</button>}
            </div>
          </form>
        ) : (
          <div className="settings-actions">
            <button type="button" className="button secondary" onClick={() => setEditing(true)}><KeyRound size={17} /> Change key</button>
            <button type="button" className="button" onClick={dismiss}>Done <Check size={17} /></button>
          </div>
        )}
        {configured && <button type="button" className="text-button" onClick={remove}><Trash2 size={16} /> Remove key from this tab</button>}
        <div className="settings-privacy" id="key-privacy">
          <ShieldCheck size={20} aria-hidden="true" />
          <div><strong>In memory, for this tab only.</strong>
            <p>Refreshing or closing this tab clears your key. It is not saved in browser storage. Saving it here does not contact Groq.</p>
            <p>When you generate an explanation, your key passes through this site's backend, then to Groq with your question and indicators. Deployed sites must use HTTPS. The site operator can access the key while processing the request. Only use a site you trust.</p>
            <p>Removing or replacing the key cancels pending responses and changes future requests. It cannot recall a request already sent.</p>
          </div>
        </div>
        <a className="settings-link text-button" href="https://console.groq.com/" target="_blank" rel="noopener noreferrer">Create or manage a key at Groq <ArrowUpRight size={16} /></a>
        <p className="caption">Groq account limits and charges may apply. No key is needed to explore data, calculate HDI or compare scenarios.</p>
      </div>
    </dialog>
  );
}
