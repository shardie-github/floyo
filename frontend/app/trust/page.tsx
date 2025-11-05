// [STAKE+TRUST:BEGIN:trust_page]
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TrustCenter() {
  const [flags, setFlags] = useState<any>({});
  
  useEffect(() => {
    // Load trust flags (in real implementation, fetch from API)
    fetch('/api/flags/trust')
      .then(r => r.json())
      .then(d => setFlags(d))
      .catch(() => setFlags({}));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Trust & Transparency
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your data privacy and security transparency center
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/privacy/policy"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Policy
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Learn how we collect, use, and protect your data
          </p>
        </Link>

        {flags.status_page && (
          <Link
            href="/status"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Status & Uptime
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View current system status and incident history
            </p>
          </Link>
        )}

        {flags.help_center && (
          <Link
            href="/help"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Help Center
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get help with common questions and issues
            </p>
          </Link>
        )}

        {flags.export_portability && (
          <Link
            href="/account/export"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Export My Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download a copy of your data
            </p>
          </Link>
        )}

        {flags.audit_log && (
          <Link
            href="/account/audit-log"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              My Audit Log
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your account activity and data access logs
            </p>
          </Link>
        )}

        <Link
          href="/dashboard/trust"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Guardian
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View your privacy transparency dashboard
          </p>
        </Link>
      </div>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Your Rights
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Access your data</li>
          <li>Export your data</li>
          <li>Delete your data</li>
          <li>Correct inaccurate data</li>
          <li>Object to processing</li>
        </ul>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:trust_page]
