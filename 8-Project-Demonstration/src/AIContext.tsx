import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

export type AIStatus = "unconfigured" | "configured" | "connected" | "invalid" | "limited" | "unavailable";
export const validGroqKey = (value: string) => /^gsk_[A-Za-z0-9_-]{20,252}$/.test(value);
type AIContextValue = {
  configured: boolean;
  revision: number;
  status: AIStatus;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  saveKey: (value: string) => boolean;
  clearKey: () => void;
  markStatus: (value: AIStatus, revision: number) => void;
  startRequest: () => {
    key: string;
    revision: number;
    controller: AbortController;
    release: () => void;
  };
};
const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  // Credentials exist only in this mounted tab. Never write them to browser storage.
  const keyRef = useRef("");
  const revisionRef = useRef(0);
  const requests = useRef(new Set<AbortController>());
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<AIStatus>("unconfigured");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const replaceKey = useCallback((value: string) => {
    requests.current.forEach((controller) => controller.abort());
    requests.current.clear();
    keyRef.current = value;
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setStatus(value ? "configured" : "unconfigured");
  }, []);
  const saveKey = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!validGroqKey(trimmed)) return false;
    replaceKey(trimmed);
    return true;
  }, [replaceKey]);
  const clearKey = useCallback(() => replaceKey(""), [replaceKey]);
  const markStatus = useCallback((value: AIStatus, requestRevision: number) => {
    if (requestRevision === revisionRef.current && keyRef.current) setStatus(value);
  }, []);
  const startRequest = useCallback(() => {
    const controller = new AbortController();
    requests.current.add(controller);
    return {
      key: keyRef.current,
      revision: revisionRef.current,
      controller,
      release: () => { requests.current.delete(controller); },
    };
  }, []);

  return (
    <AIContext.Provider value={{
      configured: !!keyRef.current, revision, status, settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      saveKey, clearKey, markStatus, startRequest,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const value = useContext(AIContext);
  if (!value) throw new Error("AI settings must be used inside AIProvider.");
  return value;
}
