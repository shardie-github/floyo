"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Lazy load Vercel Analytics
const VercelAnalytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })),
  {
    ssr: false,
  }
);

export function VercelAnalyticsIntegration() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!integrationsConfig.vercelAnalytics || typeof window === "undefined") return;

    const checkConsent = () => {
      const consent = JSON.parse(localStorage.getItem("privacy_choices_v2") || "{}");
      setShouldLoad(consent.analytics === true);
    };

    checkConsent();

    // Listen for consent changes
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener("consentChanged", handleConsentChange);
    return () => {
      window.removeEventListener("consentChanged", handleConsentChange);
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <ConsentGate requireKey="analytics">
      <VercelAnalytics />
    </ConsentGate>
  );
}
