"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import flags from "@/config/integrations.json";
import ConsentGate from "@/components/integrations/ConsentGate";

const LottiePlayer = dynamic(() => import("@/components/ui/LottiePlayer").then(m => m.default), { ssr: false });
const LiveVisitors = dynamic(() => import("@/components/integrations/LiveVisitors").then(m => m.default), { ssr: false });
const TrustpilotBadge = dynamic(() => import("@/components/integrations/TrustpilotBadge").then(m => m.default), { ssr: false });

export default function IntegrationsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Integrations Showcase</h1>
      <p className="text-sm text-muted-foreground">All modules are consent-gated and lazy-loaded to protect performance.</p>

      {/* Analytics (example: Vercel Analytics is typically in layout; others demoed here only when consent allows) */}
      {flags.lottie && (
        <section aria-labelledby="anim">
          <h2 id="anim" className="text-xl font-semibold mb-2">Lottie Animations</h2>
          <LottiePlayer src="/lottie/hero.json" />
        </section>
      )}

      {flags.lenis && (
        <section aria-labelledby="motion">
          <h2 id="motion" className="text-xl font-semibold mb-2">Smooth Motion/Scroll</h2>
          <p className="text-sm">Lenis enabled globally (verify smooth scroll in long pages).</p>
        </section>
      )}

      {(flags.pusher || flags.ably) && (
        <section aria-labelledby="live">
          <h2 id="live" className="text-xl font-semibold mb-2">Live Activity</h2>
          <LiveVisitors />
        </section>
      )}

      {flags.trustpilot && (
        <ConsentGate requireKey="analytics">
          <section aria-labelledby="trust">
            <h2 id="trust" className="text-xl font-semibold mb-2">Trust Badges</h2>
            <TrustpilotBadge />
          </section>
        </ConsentGate>
      )}

      {(flags.tidio || flags.crisp) && (
        <ConsentGate requireKey="marketing">
          <section aria-labelledby="chat">
            <h2 id="chat" className="text-xl font-semibold mb-2">Chat Widget</h2>
            <p className="text-sm text-muted-foreground">Chat loads after consent; check site corner for bubble.</p>
          </section>
        </ConsentGate>
      )}
    </div>
  );
}