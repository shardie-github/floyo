"use client";
import { useEffect } from "react";
import integrationsConfig from "@/config/integrations.json";

export function LenisSmoothScrollIntegration() {
  useEffect(() => {
    if (!integrationsConfig.lenis || typeof window === "undefined") return;

    let lenisInstance: any;
    let rafId: number;

    import("lenis").then((LenisModule) => {
      const Lenis = LenisModule.default;
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time: number) {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, []);

  return null;
}
