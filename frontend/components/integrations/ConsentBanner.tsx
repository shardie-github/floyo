"use client";
import { useState, useEffect } from "react";
import { useConsent } from "@/hooks/useConsent";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function ConsentBanner() {
  const { consent, setConsent } = useConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has seen consent banner before
    if (typeof window !== "undefined") {
      const hasSeenBanner = localStorage.getItem("consent_banner_seen");
      const hasConsent = consent.analytics || consent.marketing;
      
      // Show banner if:
      // 1. User hasn't seen it before, OR
      // 2. User hasn't given any consent yet
      if (!hasSeenBanner || (!hasConsent && !consent.analytics && !consent.marketing)) {
        setShowBanner(true);
      }
    }
  }, [consent]);

  const handleAcceptAll = () => {
    setConsent({
      analytics: true,
      marketing: true,
      functional: true,
    });
    localStorage.setItem("consent_banner_seen", "true");
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    setConsent({
      analytics: false,
      marketing: false,
      functional: true, // Functional is always true
    });
    localStorage.setItem("consent_banner_seen", "true");
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowDetails(true);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("consent_banner_seen", "true");
    setShowBanner(false);
    setShowDetails(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl"
      >
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {!showDetails ? (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Privacy Preferences
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We use cookies and similar technologies to improve your experience, analyze site usage, and assist with marketing efforts. 
                    You can customize your preferences or accept all cookies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleCustomize}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Link
                  href="/privacy/policy"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Learn more about our privacy practices →
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Customize Your Privacy Preferences
              </h3>
              
              {/* Analytics Consent */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Analytics</h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Help us improve our site by allowing analytics services like Vercel Analytics, Sentry error tracking, and PostHog. 
                      These services help us understand how visitors interact with our site and identify issues.
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 ml-4 list-disc">
                      <li>Page views and navigation patterns</li>
                      <li>Error tracking and performance monitoring</li>
                      <li>No personal information collected</li>
                    </ul>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) =>
                        setConsent({ ...consent, analytics: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                    />
                  </label>
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Marketing</h4>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                        Optional
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Enable marketing tools like chat widgets and social proof features. 
                      These help provide better customer support and showcase social engagement.
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 ml-4 list-disc">
                      <li>Live chat widgets</li>
                      <li>Social proof and engagement features</li>
                      <li>Marketing campaign tracking</li>
                    </ul>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) =>
                        setConsent({ ...consent, marketing: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                    />
                  </label>
                </div>
              </div>

              {/* Functional Notice */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Functional Cookies
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      These cookies are essential for the website to function properly and cannot be disabled. 
                      They include security features, accessibility options, and basic site functionality.
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Always On</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetails(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
