"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Mock live visitors component - in production, this would connect to Pusher/Ably
function LiveVisitorsContent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Simulate live visitor count updates
    const interval = setInterval(() => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(0, prev + delta);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
        </div>
        <span className="text-sm font-medium">
          {count} {count === 1 ? "person" : "people"} viewing this page
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {integrationsConfig.pusher
          ? "Powered by Pusher"
          : integrationsConfig.ably
          ? "Powered by Ably"
          : "Demo mode"}
      </p>
    </div>
  );
}

export default function LiveVisitors() {
  if (!integrationsConfig.pusher && !integrationsConfig.ably) return null;

  return (
    <ConsentGate requireKey="analytics">
      <LiveVisitorsContent />
    </ConsentGate>
  );
}