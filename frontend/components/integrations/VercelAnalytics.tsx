"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Lazy load Vercel Analytics
const VercelAnalytics = dynamic(() => import("@vercel/analytics/react").then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

export function VercelAnalyticsIntegration() {
  if (!integrationsConfig.vercelAnalytics) return null;

  return (
    <ConsentGate requireKey="analytics">
      <VercelAnalytics />
    </ConsentGate>
  );
}
