"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Consent = { analytics: boolean; marketing: boolean; functional: boolean };
type ConsentStatus = "pending" | "accepted" | "rejected" | "customized";

interface ConsentContextType {
  consent: Consent;
  status: ConsentStatus;
  setConsent: (c: Consent) => void;
  hasInitialized: boolean;
}

const ConsentCtx = createContext<ConsentContextType>({
  consent: { analytics: false, marketing: false, functional: true },
  status: "pending",
  setConsent: () => {},
  hasInitialized: false,
});

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<Consent>(() => {
    if (typeof window === "undefined") {
      return { analytics: false, marketing: false, functional: true };
    }
    try {
      const stored = localStorage.getItem("privacy_choices_v2");
      if (stored) {
        return JSON.parse(stored) as Consent;
      }
    } catch (e) {
      console.warn("Failed to parse consent from localStorage", e);
    }
    return { analytics: false, marketing: false, functional: true };
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  // Determine consent status
  const getConsentStatus = useCallback((): ConsentStatus => {
    if (!hasInitialized) return "pending";
    if (consent.analytics && consent.marketing) return "accepted";
    if (!consent.analytics && !consent.marketing) return "rejected";
    return "customized";
  }, [consent, hasInitialized]);

  const [status, setStatus] = useState<ConsentStatus>("pending");

  const setConsent = useCallback((newConsent: Consent) => {
    setConsentState(newConsent);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("privacy_choices_v2", JSON.stringify(newConsent));
        
        // Dispatch event for integrations to react to consent changes
        window.dispatchEvent(
          new CustomEvent("consentChanged", { detail: newConsent })
        );
      } catch (e) {
        console.warn("Failed to save consent to localStorage", e);
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasInitialized(true);
      setStatus(getConsentStatus());
    }
  }, [getConsentStatus]);

  // Update status when consent changes
  useEffect(() => {
    if (hasInitialized) {
      setStatus(getConsentStatus());
    }
  }, [consent, hasInitialized, getConsentStatus]);

  // Listen for consent changes from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "privacy_choices_v2" && e.newValue) {
        try {
          const newConsent = JSON.parse(e.newValue) as Consent;
          setConsentState(newConsent);
          setStatus(getConsentStatus());
        } catch (e) {
          console.warn("Failed to parse consent from storage event", e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getConsentStatus]);

  return (
    <ConsentCtx.Provider
      value={{
        consent,
        status,
        setConsent,
        hasInitialized,
      }}
    >
      {children}
    </ConsentCtx.Provider>
  );
}

export const useConsent = () => {
  const context = useContext(ConsentCtx);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return context;
};
