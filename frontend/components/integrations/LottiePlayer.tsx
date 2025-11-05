"use client";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Lazy load Lottie player
const LottiePlayer = dynamic(() => import("@lottiefiles/react-lottie-player").then(mod => ({ default: mod.Player })), {
  ssr: false,
});

export function LottiePlayerIntegration({ src, className, autoplay = true, loop = true }: {
  src: string | object;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
}) {
  if (!integrationsConfig.lottie) return null;

  return (
    <div className={className} style={{ minHeight: "200px" }}>
      <LottiePlayer
        autoplay={autoplay}
        loop={loop}
        src={src}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
