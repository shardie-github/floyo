"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Consent = { analytics: boolean; marketing: boolean; functional: boolean };
const ConsentCtx = createContext<{consent: Consent; setConsent: (c: Consent)=>void}>({
  consent: { analytics: false, marketing: false, functional: true },
  setConsent: () => {}
});

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent>(() => {
    if (typeof window === "undefined") return { analytics: false, marketing: false, functional: true };
    try { return JSON.parse(localStorage.getItem("privacy_choices_v2") || "{}") as Consent; } catch { return { analytics: false, marketing: false, functional: true }; }
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("privacy_choices_v2", JSON.stringify(consent));
  }, [consent]);

  return <ConsentCtx.Provider value={{ consent, setConsent }}>{children}</ConsentCtx.Provider>;
}
export const useConsent = () => useContext(ConsentCtx);
