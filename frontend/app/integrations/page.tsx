"use client";
import { useState } from "react";
import { useConsent } from "@/app/providers/consent-provider";
import { HCaptchaIntegration } from "@/components/integrations/hCaptcha";
import { LottiePlayerIntegration } from "@/components/integrations/LottiePlayer";
import { CldImage } from "@/components/integrations/Cloudinary";
import { ZapierIntegration } from "@/components/integrations/ZapierIntegration";
import { MindStudioIntegration } from "@/components/integrations/MindStudioIntegration";
import integrationsConfig from "@/config/integrations.json";
import { motion } from "framer-motion";

export default function IntegrationsPage() {
  const { consent, setConsent } = useConsent();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const sampleLottieAnimation = {
    v: "5.5.2",
    fr: 60,
    ip: 0,
    op: 180,
    w: 200,
    h: 200,
    nm: "Sample",
    ddd: 0,
    assets: [],
    layers: [{
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [
          { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
          { t: 180, s: [360] }
        ]},
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [{
          d: 1,
          ty: "el",
          s: { a: 0, k: [50, 50] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse Path 1"
        }],
        p: { a: 0, k: [0, 0] },
        o: { a: 0, k: 100 },
        nm: "Ellipse 1"
      }]
    }]
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Integration Showcase</h1>
      <p className="text-muted-foreground mb-8">
        Demo page for all enabled front-end enrichments. Each integration is lazy-loaded and consent-gated.
      </p>

      {/* Consent Controls */}
      <section className="mb-12 p-6 border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Consent Controls</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Analytics (Vercel Analytics, Sentry, PostHog)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Marketing (Chat widgets, social proof)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent.functional}
              onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Functional (Essential features)</span>
          </label>
        </div>
      </section>

      {/* Integration Status */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Integration Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(integrationsConfig).map(([key, enabled]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border rounded-lg ${enabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`px-2 py-1 text-xs rounded ${enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Framer Motion Demo */}
      {integrationsConfig.framerMotion && (
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Framer Motion</h2>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-primary text-primary-foreground rounded-lg text-center cursor-pointer"
              >
                Hover me {i}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Lottie Animation Demo */}
      {integrationsConfig.lottie && (
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Lottie Animation</h2>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <LottiePlayerIntegration
                src={sampleLottieAnimation}
                autoplay={true}
                loop={true}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Sample rotating circle animation (you can replace with actual Lottie JSON)
          </p>
        </section>
      )}

      {/* Cloudinary Demo */}
      {integrationsConfig.cloudinary && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Cloudinary Image</h2>
          <div className="flex justify-center">
            <CldImage
              src="sample"
              width={400}
              height={300}
              alt="Cloudinary sample"
              className="rounded-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Replace &quot;sample&quot; with your actual Cloudinary image ID
          </p>
        </section>
      )}

      {/* hCaptcha Demo */}
      {integrationsConfig.hcaptcha && (
        <section className="mb-12 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">hCaptcha</h2>
          <div className="max-w-md mx-auto">
            <HCaptchaIntegration
              onVerify={(token) => {
                setCaptchaToken(token);
                if (process.env.NODE_ENV === 'development') {
                  console.debug("Captcha verified:", token);
                }
              }}
              onExpire={() => {
                setCaptchaToken(null);
                if (process.env.NODE_ENV === 'development') {
                  console.debug("Captcha expired");
                }
              }}
              onError={(error) => {
                console.error("Captcha error:", error);
              }}
            />
            {captchaToken && (
              <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                ✓ Captcha verified! Token: {captchaToken.substring(0, 20)}...
              </p>
            )}
          </div>
        </section>
      )}

      {/* Lenis Smooth Scroll Note */}
      {integrationsConfig.lenis && (
        <section className="mb-12 p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h2 className="text-2xl font-semibold mb-4">Lenis Smooth Scroll</h2>
          <p className="text-muted-foreground">
            Smooth scrolling is enabled globally. Try scrolling this page to experience the difference!
          </p>
        </section>
      )}

      {/* Zapier Integration */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Workflow Integrations</h2>
        <div className="space-y-4">
          <ZapierIntegration />
          <MindStudioIntegration />
        </div>
      </section>

      {/* Analytics Note */}
      <section className="mb-12 p-6 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <h2 className="text-2xl font-semibold mb-4">Analytics Integrations</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          {integrationsConfig.vercelAnalytics && (
            <li>Vercel Analytics: Tracks page views (consent-gated)</li>
          )}
          {integrationsConfig.sentry && (
            <li>Sentry: Error tracking and performance monitoring (consent-gated)</li>
          )}
          {integrationsConfig.posthog && (
            <li>PostHog: Product analytics, feature flags, session replay (consent-gated)</li>
          )}
        </ul>
        <p className="mt-4 text-sm">
          All analytics are disabled until you grant &quot;Analytics&quot; consent above.
        </p>
      </section>
    </div>
  );
}
