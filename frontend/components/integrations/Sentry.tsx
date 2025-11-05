"use client";
import { useEffect } from "react";
import integrationsConfig from "@/config/integrations.json";

export function SentryIntegration() {
  useEffect(() => {
    if (!integrationsConfig.sentry || typeof window === "undefined") return;

    const initializeSentry = () => {
      const consent = JSON.parse(localStorage.getItem("privacy_choices_v2") || "{}");
      if (consent.analytics) {
        const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
        if (sentryDsn) {
          import("@sentry/nextjs").then((Sentry) => {
            // Only initialize if not already initialized
            if (!(window as any).__SENTRY_INITIALIZED__) {
              Sentry.init({
                dsn: sentryDsn,
                environment: process.env.NODE_ENV,
                tracesSampleRate: 0.1,
                beforeSend(event, hint) {
                  // Scrub PII
                  if (event.request) {
                    delete event.request.cookies;
                    delete event.request.headers?.["authorization"];
                  }
                  return event;
                },
              });
              (window as any).__SENTRY_INITIALIZED__ = true;
            }
          });
        }
      }
    };

    // Initialize on mount
    initializeSentry();

    // Listen for consent changes
    const handleConsentChange = () => {
      initializeSentry();
    };

    window.addEventListener("consentChanged", handleConsentChange);
    return () => {
      window.removeEventListener("consentChanged", handleConsentChange);
    };
  }, []);

  return null;
}
