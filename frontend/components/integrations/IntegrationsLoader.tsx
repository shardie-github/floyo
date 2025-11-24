"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { VercelAnalyticsIntegration } from "./VercelAnalytics";
import { SentryIntegration } from "./Sentry";
import { PostHogIntegration } from "./PostHog";
import { LenisSmoothScrollIntegration } from "./LenisSmoothScroll";

// Lazy load all integrations
const LottiePlayerIntegration = dynamic(() => import("./LottiePlayer").then(mod => ({ default: mod.LottiePlayerIntegration })), {
  ssr: false,
});

export function IntegrationsLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      {/* Functional integrations (always loaded) */}
      <LenisSmoothScrollIntegration />
      
      {/* Analytics integrations (consent-gated) */}
      <VercelAnalyticsIntegration />
      <SentryIntegration />
      
      {/* PostHog wraps children */}
      <PostHogIntegration>
        {children}
      </PostHogIntegration>
    </Suspense>
  );
}
