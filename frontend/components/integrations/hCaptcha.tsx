"use client";
import dynamic from "next/dynamic";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

// Lazy load hCaptcha
const HCaptcha = dynamic(() => import("@hcaptcha/react-hcaptcha"), {
  ssr: false,
});

export function HCaptchaIntegration({ onVerify, onExpire, onError }: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
}) {
  if (!integrationsConfig.hcaptcha) return null;

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;
  if (!siteKey) return null;

  return (
    <ConsentGate requireKey="functional">
      <div style={{ minHeight: "78px" }}>
        <HCaptcha
          sitekey={siteKey}
          onVerify={onVerify}
          onExpire={onExpire}
          onError={onError}
        />
      </div>
    </ConsentGate>
  );
}
