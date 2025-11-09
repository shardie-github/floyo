'use client';

import { useEffect, useState } from 'react';

export default function APIDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(setSpec);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          API Documentation
        </h1>

        {spec ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <pre className="overflow-auto text-sm">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Import this OpenAPI spec into Postman, Insomnia, or Swagger UI for interactive API testing.
          </p>
        </div>
      </div>
    </div>
  );
}
