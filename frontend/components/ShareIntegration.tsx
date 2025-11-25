'use client';

import { useState } from 'react';

interface ShareIntegrationProps {
  integrationId: string;
  integrationName: string;
  integrationDescription?: string;
}

export default function ShareIntegration({
  integrationId,
  integrationName,
  integrationDescription,
}: ShareIntegrationProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/${integrationId}`;

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'copy') => {
    // Track share event
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{
          event_type: 'share',
          properties: {
            integration_id: integrationId,
            platform,
          },
        }],
      }),
    });

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'twitter') {
      const text = `Check out this integration suggestion: ${integrationName}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Share this integration:</span>
      <button
        onClick={() => handleShare('twitter')}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        aria-label="Share on Twitter"
      >
        Twitter
      </button>
      <button
        onClick={() => handleShare('linkedin')}
        className="px-3 py-1 text-sm bg-blue-700 text-white rounded hover:bg-blue-800"
        aria-label="Share on LinkedIn"
      >
        LinkedIn
      </button>
      <button
        onClick={() => handleShare('copy')}
        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        aria-label="Copy link"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
