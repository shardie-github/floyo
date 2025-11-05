"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Lazy load Sentry
const SentryInit = dynamic(() => import("@sentry/nextjs").then(mod => ({ default: mod.init })), {
  ssr: false,
});

export function SentryIntegration() {
  useEffect(() => {
    if (!integrationsConfig.sentry || typeof window === "undefined") return;
    
    // Initialize Sentry only if consent is given
    const consent = JSON.parse(localStorage.getItem("privacy_choices_v2") || "{}");
    if (consent.analytics) {
      const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (sentryDsn) {
        import("@sentry/nextjs").then((Sentry) => {
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
        });
      }
    }
  }, []);

  return null;
}
