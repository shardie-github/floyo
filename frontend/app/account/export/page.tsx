// [STAKE+TRUST:BEGIN:export_page]
"use client";

import { useState } from 'react';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      if (data.url) {
        setExportUrl(data.url);
      } else {
        throw new Error('Export URL not provided');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Export My Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Download a copy of your data in JSON format
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          What's Included
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Account information</li>
          <li>Usage events (if enabled)</li>
          <li>Privacy preferences</li>
          <li>Settings and configuration</li>
        </ul>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Export Your Data
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click the button below to request a data export. You will receive a download link once the export is ready.
        </p>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {exportUrl ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-800 dark:text-green-200 mb-2">
              Export ready! Your download link is valid for 24 hours.
            </p>
            <a
              href={exportUrl}
              download
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download Export
            </a>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Request Export'}
          </button>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Export requests may take a few minutes to process. You will be notified when your export is ready.
        </p>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:export_page]
