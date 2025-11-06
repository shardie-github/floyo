"use client";
import dynamic from "next/dynamic";

// Lazy load Lottie player
const LottiePlayerComponent = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => ({ default: mod.Player })),
  { ssr: false }
);

export default function LottiePlayer({
  src,
  className,
  autoplay = true,
  loop = true,
}: {
  src: string | object;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
}) {
  return (
    <div className={className} style={{ minHeight: "200px", width: "100%" }}>
      <LottiePlayerComponent
        autoplay={autoplay}
        loop={loop}
        src={src}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}