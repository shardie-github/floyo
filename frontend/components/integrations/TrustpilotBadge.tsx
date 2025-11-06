"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

function TrustpilotBadgeContent() {
  useEffect(() => {
    // Trustpilot typically loads via script tag
    // This is a placeholder that would load the actual Trustpilot widget
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID) {
      // In production, you would load Trustpilot's script here
      // Example: https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js
      console.log("Trustpilot widget would load here");
    }
  }, []);

  if (!integrationsConfig.trustpilot) return null;

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="w-5 h-5 text-yellow-400 fill-current"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <div>
          <p className="text-sm font-medium">Trusted by thousands</p>
          <p className="text-xs text-muted-foreground">
            Rated 4.8/5 on Trustpilot
          </p>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID && (
        <p className="text-xs text-muted-foreground mt-2">
          Widget would load here with business ID: {process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID.substring(0, 10)}...
        </p>
      )}
    </div>
  );
}

export default function TrustpilotBadge() {
  return (
    <ConsentGate requireKey="analytics">
      <TrustpilotBadgeContent />
    </ConsentGate>
  );
}