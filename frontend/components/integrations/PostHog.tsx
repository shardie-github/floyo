"use client";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// PostHog is already installed, lazy load it
const PostHogProvider = dynamic(() => import("posthog-js/react").then(mod => ({ default: mod.PostHogProvider })), {
  ssr: false,
});

export function PostHogIntegration({ children }: { children?: React.ReactNode }) {
  if (!integrationsConfig.posthog) return <>{children}</>;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!posthogKey) return <>{children}</>;

  return (
    <ConsentGate requireKey="analytics">
      <PostHogProvider
        apiKey={posthogKey}
        options={{
          api_host: posthogHost,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") posthog.debug();
          },
          capture_pageview: false,
          capture_pageleave: true,
        }}
      >
        {children}
      </PostHogProvider>
    </ConsentGate>
  );
}
