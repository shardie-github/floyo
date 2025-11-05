"use client";

import { useState, useEffect } from "react";
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return "good";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

export function PerformanceHUD() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const updateMetric = (name: string, value: number) => {
      setMetrics((prev) => {
        const filtered = prev.filter((m) => m.name !== name);
        return [...filtered, { name, value, rating: getRating(name, value) }];
      });
    };

    getCLS((metric) => updateMetric("CLS", metric.value));
    getFCP((metric) => updateMetric("FCP", metric.value));
    getLCP((metric) => updateMetric("LCP", metric.value));
    getTTFB((metric) => updateMetric("TTFB", metric.value));

    // FID is deprecated, use INP if available
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "first-input") {
              const fid = entry as PerformanceEventTiming;
              updateMetric("FID", fid.processingStart - fid.startTime);
            }
          }
        });
        observer.observe({ type: "first-input", buffered: true });
      } catch (e) {
        // Ignore
      }
    }

    // Keyboard shortcut to toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "`" && e.ctrlKey) {
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (process.env.NODE_ENV !== "development" || !visible) {
    return null;
  }

  const getColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "text-green-600";
      case "needs-improvement":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance HUD</h3>
        <button
          onClick={() => setVisible(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1 text-xs">
        {metrics.length === 0 ? (
          <p className="text-gray-500">Collecting metrics...</p>
        ) : (
          metrics.map((m) => (
            <div key={m.name} className="flex justify-between">
              <span>{m.name}:</span>
              <span className={getColor(m.rating)}>
                {m.value.toFixed(0)}ms ({m.rating})
              </span>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Press Ctrl+` to toggle
      </p>
    </div>
  );
}